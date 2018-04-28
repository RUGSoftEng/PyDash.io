from functools import partial
from datetime import datetime, timedelta, timezone

import json
import requests.exceptions

import flask_monitoring_dashboard_client
from pydash_app.dashboard.endpoint import Endpoint
from pydash_app.dashboard.endpoint_call import EndpointCall
from pydash_app.dashboard.dashboard import DashboardState
import pydash_app.dashboard.repository as dashboard_repository
import pydash_logger
import periodic_tasks

logger = pydash_logger.Logger(__name__)


def schedule_all_periodic_dashboards_tasks(
        interval=timedelta(hours=1),
        scheduler=periodic_tasks.default_task_scheduler):
    """
    Sets up all tasks that should be run periodically for each of the dashboards.
    (For now, that is only the EndpointCall fetching task.)
    """
    initialization_states = (
        DashboardState.not_initialized,
        DashboardState.initialized_endpoints,
        DashboardState.initialize_endpoints_failure,
        DashboardState.initialized_endpoint_calls,
        DashboardState.initialize_endpoint_calls_failure
    )
    for dashboard in dashboard_repository.all():
        if dashboard.state in initialization_states:
            schedule_historic_dashboard_fetching(
                dashboard, scheduler=scheduler)
        else:
            schedule_periodic_dashboard_fetching(
                dashboard, interval=interval, scheduler=scheduler)


def schedule_periodic_dashboard_fetching(
        dashboard,
        interval=timedelta(hours=1),
        scheduler=periodic_tasks.default_task_scheduler):
    """
    Schedules the periodic EndpointCall fetching task for this dashboard.
    """
    logger.info(f'Creating periodic fetching task for {dashboard}')

    periodic_tasks.add_periodic_task(
        name=("dashboard", dashboard.id, "fetching"),
        task=partial(fetch_and_update_new_dashboard_info, dashboard.id),
        interval=interval,
        scheduler=scheduler)


def schedule_historic_dashboard_fetching(
        dashboard, scheduler=periodic_tasks.default_task_scheduler):
    """
    Schedules the fetching of historic EndpointCall information as a background task.
    The periodic fetching of new EndpointCall information is scheduled as soon as this task completes.
    """

    def task(dashboard_id):
        fetch_and_update_historic_dashboard_info(dashboard_id)
        schedule_periodic_dashboard_fetching(dashboard_id)

    periodic_tasks.add_background_task(
        name=("dashboard", dashboard.id, "historic_fetching"),
        task=partial(task, dashboard.id),
        scheduler=scheduler)


def fetch_and_update_new_dashboard_info(dashboard_id):
    """
    Updates the dashboard with the new EndpointCall information that is fetched from the Dashboard's remote location.
    """
    dashboard = dashboard_repository.find(dashboard_id)

    logger.info(f'INSIDE FETCH FUNCTION: {dashboard_id}')

    fetch_and_add_endpoint_calls(dashboard)

    logger.info(f'{len(dashboard.endpoints)} endpoints found')
    logger.info(f'{len(dashboard._endpoint_calls)} endpoint calls')

    dashboard_repository.update(dashboard)

    logger.info(f"Dashboard {dashboard_id} updated")


def fetch_and_update_historic_dashboard_info(dashboard_id):
    """
    Updates the dashboard with the historic EndpointCall information that is fetched from the Dashboard's remote location.
    """
    dashboard = dashboard_repository.find(dashboard_id)

    logger.info(f'INSIDE INITIAL FETCHING FUNCTION: {dashboard_id}')

    fetch_and_add_endpoints(dashboard)
    fetch_and_add_historic_endpoint_calls(dashboard)

    logger.info(f'{len(dashboard.endpoints)} endpoints found')
    logger.info(f'{len(dashboard._endpoint_calls)} historical endpoint calls')

    dashboard_repository.update(dashboard)


# Endpoints


def fetch_and_add_endpoints(dashboard):
    """
    For a given dashboard, initialize it with the endpoints it has registered.
    Note that this will not add endpoint call data.
    :param dashboard: The dashboard to initialize with endpoints.
    """

    # Only run this function if no endpoints have been added yet
    if dashboard.state != DashboardState.not_initialized:
        logger.warning(f'Tried to add endpoints from a wrong state: {dashboard.state} for dashboard: {dashboard}')
        return

    endpoints = _fetch_endpoints(dashboard)

    for endpoint in endpoints:
        dashboard.add_endpoint(endpoint)


def _fetch_endpoints(dashboard):
    """
    Fetches and returns a list of `Endpoint`s in the given dashboard.
    :param dashboard: The dashboard for which to fetch endpoints.
    :return: A list of `Endpoint`s for the dashboard.
    """

    monitor_rules = flask_monitoring_dashboard_client.get_monitor_rules(
        dashboard.url, dashboard.token)

    if monitor_rules is None:
        return []

    return [
        Endpoint(rule['endpoint'], rule['monitor']) for rule in monitor_rules
    ]


# EndpointCalls


def fetch_and_add_historic_endpoint_calls(dashboard):
    """
    For a given dashboard, retrieve all historical endpoint calls and add them to it.
    :param dashboard: The dashboard to initialize with historical data.
    """

    # Only run this function if no periodic fetching of latest information has happened yet:
    if dashboard.state != DashboardState.initialized_endpoints:
        logger.warning(
            f'Tried to add historic endpoint calls from a wrong state: {dashboard.state} for dashboard: {dashboard}')
        return

    try:
        details = flask_monitoring_dashboard_client.get_details(dashboard.url)
    except requests.exceptions.ConnectionError as e:
        logger.error(f'Connection error happened while initializing EndpointCalls: {e}')
        dashboard.state = DashboardState.initialize_endpoint_calls_failure
        dashboard.error = str(e)
        return
    except requests.exceptions.HTTPError as e:
        logger.error(f'HTTP error happened while initializing EndpointCalls: {e}')
        dashboard.state = DashboardState.initialize_endpoint_calls_failure
        dashboard.error = str(e)
        return
    except json.JSONDecodeError as e:
        logger.error(f'JSON decode error happened while initializing EndpointCalls: {e}')
        dashboard.state = DashboardState.initialize_endpoint_calls_failure
        dashboard.error = str(e)
        return

    try:
        first_request = int(details['first_request'])
    except KeyError:
        error_text = f'Dashboard details do not contain date of first request: {details}'
        logger.error(error_text)
        dashboard.state = DashboardState.initialize_endpoint_calls_failure
        dashboard.error = error_text
        return
    except ValueError:
        error_text = f"Dashboard details date of first request is not a timestamp: {details['first_request']}"
        logger.error(error_text)
        dashboard.state = DashboardState.initialize_endpoint_calls_failure
        dashboard.error = error_text
        return

    start_time = datetime.fromtimestamp(first_request, tz=timezone.utc)
    current_time = datetime.now(timezone.utc)

    while start_time < current_time:
        # TODO: for now historical data is pulled in chunks of 1 hour (hardcoded)
        end_time = start_time + timedelta(hours=1)

        if end_time > current_time:
            end_time = current_time

        endpoint_calls = _fetch_endpoint_calls(dashboard, start_time, end_time)

        if endpoint_calls is None:
            continue

        for call in endpoint_calls:
            dashboard.add_endpoint_call(call)
            dashboard.last_fetch_time = call.time

        start_time = end_time


def fetch_and_add_endpoint_calls(dashboard):
    """
    Retrieve the latest endpoint calls of the given dashboard and add them to it.
    :param dashboard: The dashboard for which to update endpoint calls.
    """

    logger.info(f"Updating endpoint calls for dashboard: {dashboard}")

    # Only run this function if historic fetching has happened:
    # - in the initialized_endpoint_calls state, we have just successfully fetched historic endpoint calls;
    # - in the fetched_endpoint_calls state, we have just successfully fetched new endpoint calls;
    # - in the fetch_endpoint_calls_failure state, we have failed to get the latest endpoint calls, so we will retry.
    allowed_states = (
        DashboardState.initialized_endpoint_calls,
        DashboardState.fetched_endpoint_calls,
        DashboardState.fetch_endpoint_calls_failure
    )
    if dashboard.state not in allowed_states:
        logger.warning(
            f'Tried to add new endpoint calls from a wrong state: {dashboard.state} for dashboard: {dashboard}')
        return

    new_calls = _fetch_endpoint_calls(
        dashboard, time_from=dashboard.last_fetch_time)

    if not new_calls:
        logger.info(f'No new calls for dashboard: {dashboard}')
        return

    logger.info(f'New endpoint calls: {new_calls}')

    for call in new_calls:
        dashboard.add_endpoint_call(call)

    dashboard.last_fetch_time = new_calls[-1].time

    logger.info(f'Saved to database: dashboard {dashboard}')


def _fetch_endpoint_calls(dashboard, time_from=None, time_to=None):
    """
    Fetches and returns a list of `EndpointCall`s for the given dashboard.
    :param dashboard: The dashboard for which to fetch endpoint calls.
    :param time_from: An operiodic_tasksional datetime indicating only data since that moment should be returned.
    :param time_to: An operiodic_tasksional datetime indicating only data up to that point should be returned.
    :return: A list of `EndpointCall`s containing the endpoint call data for this dashboard.
    """

    endpoint_requests = flask_monitoring_dashboard_client.get_data(
        dashboard.url, dashboard.token, time_from, time_to)

    if endpoint_requests is None:
        return []

    endpoint_calls = []
    for request in endpoint_requests:
        # The raw endpoint call data contains a timestamp formatted
        # as "yyyy-mm-dd hh:mm:ss.micro" so we need to parse it
        time = datetime.strptime(request['time'], '%Y-%m-%d %H:%M:%S.%f')
        time.replace(tzinfo=timezone.utc)

        call = EndpointCall(request['endpoint'], request['execution_time'],
                            time, request['version'], request['group_by'],
                            request['ip'])
        endpoint_calls.append(call)

    return endpoint_calls
