
import uuid
import persistent


class Dashboard(persistent.Persistent):
    """

    """

    def __init__(self, url, user_id):
        if not isinstance(url, str) or not isinstance(user_id, str):
            raise TypeError("Dashboard expects both url and user_id to be strings.")

        self.id = uuid.uuid4()
        self.url = url
        self.user_id = uuid.UUID(user_id)
        self.endpoints = list()
        self.endpoint_calls = list()
        self.last_fetch_time = None

    def __repr__(self):
        return f'<{self.__class__.__name__} id={self.id} url={self.url} endpoints={self.endpoints}>'

    def get_id(self):
        return str(self.id)

    def add_endpoint(self, endpoint):
        self.endpoints.append(endpoint)

    def remove_endpoint(self, endpoint):
        # TODO: perhaps remove all relevant endpoint calls from endpoint_calls?
        self.endpoints.remove(endpoint)

    # Required because `multi_indexed_collection` puts dashboards in a set,
    #  that needs to order its keys for fast lookup.
    # Because the IDs are unchanging integer values, use that.
    def __lt__(self, other):
        return self.id < other.id