from flask import jsonify, request
from flask_login import current_user

import pydash_app.dashboard
import pydash_logger
import pydash_app.dashboard.services.fetching


logger = pydash_logger.Logger(__name__)


def register_dashboard():
    request_data = request.get_json(silent=True)

    if not request_data:
        logger.warning('Dashboard registration failed - data missing')
        result = {'message': 'Data missing'}
        return jsonify(result), 400

    name = request_data.get('name')
    url = request_data.get('url')
    token = request_data.get('token')

    if url is None or token is None:
        logger.warning("Dashboard registration failed - url or token are missing.")
        result = {'message': 'Name, url or token are missing.'}
        return jsonify(result), 400

    # In case name is '' or None (since name is optional)
    if not name:
        name = None

    is_valid, result = _is_valid_dashboard(url)
    if not is_valid:
        return jsonify(result), 400

    dashboard = pydash_app.dashboard.Dashboard(url, token, str(current_user.id), name)
    pydash_app.dashboard.add_to_repository(dashboard)
    message = {'message': 'Dashboard successfully registered to user.'}
    logger.info(f"Dashboard {name} ({url}) successfully registered to user {current_user.id} ")

    pydash_app.dashboard.services.fetching.schedule_historic_dashboard_fetching(dashboard)

    return jsonify(message), 200


def _is_valid_dashboard(url):
    import requests.exceptions
    import json
    import flask_monitoring_dashboard_client

    try:
        details = flask_monitoring_dashboard_client.get_details(url)
        version = details['dashboard-version']
    except requests.exceptions.ConnectionError:
        return False, {'message': 'Could not connect to the dashboard'}
    except requests.exceptions.Timeout:
        return False, {'message': 'Timeout while connecting to the dashboard'}
    except requests.exceptions.HTTPError as e:
        if e.response:
            return False, {'message': f'HTTP {e.response.status_code} error while connecting to the dashboard'}
        return False, {'message': 'HTTP error while connecting to the dashboard'}
    except json.JSONDecodeError:
        return False, {'message': f'{url} does not seem to host a valid dashboard'}
    except KeyError:
        return False, {'message': 'Unsupported version of Flask-MonitoringDashboard'}
    except requests.exceptions.RequestException:
        return False, {'message': f'{url} seems to be an invalid url'}

    return True, None
