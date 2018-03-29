import persistent


class Aggregator(persistent.Persistent):
    """
    Maintains aggregate data for either a dashboard or a single endpoint.
    This data is updated every time a new endpoint call is added.
    """

    def __init__(self, endpoint_calls):
        """
        Constructor
        :param endpoint_calls: List of endpoint calls to keep track of
        """

        self._endpoint_calls = endpoint_calls

        self.total_visits = 0
        self.total_execution_time = 0

    def add_endpoint_call(self, endpoint_call):
        """
        Add an endpoint call and update aggregated data
        :param endpoint_call: `EndpointCall` instance to add
        """

        # precondition: the endpoint call has been added to the list of endpoint calls already

        self.total_visits += 1
        self.total_execution_time += endpoint_call.execution_time

    def as_dict(self):
        """
        Get aggregated data in a dict
        :return: A dict containing several aggregated data points
        """

        return {
            'total_visits': self.total_visits,
            'total_execution_time': self.total_execution_time,
        }