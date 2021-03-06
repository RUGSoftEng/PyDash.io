"""
This module handles the persistence of `User` entities:

It is an adapter of the actual persistence layer, to insulate the application
from datastore-specific details.

It handles a subset of the following tasks
(specifically, it only actually contains functions for the tasks the application needs in its current state!):
- Creating new entities of the specified type
- Finding them based on certain attributes
- Persisting updated versions of existing entities.
- Deleting entities from the persistence layer.
"""
import uuid
import transaction
from pydash_database import database_root, MultiIndexedPersistentCollection
from multi_indexed_collection import DuplicateIndexError

from .entity import User


if not hasattr(database_root(), 'users'):
    transaction.begin()
    database_root().users = MultiIndexedPersistentCollection({'id', 'name', '_verification_code'})
    transaction.commit()


def find(user_id):
    """
    Finds a user in the database.
    :param user_id: UUID for the user to be retrieved.
    :return: User object or None if no user could be found.
    """
    # Ensure that also callable with strings or integers:
    if not isinstance(user_id, uuid.UUID):
        user_id = uuid.UUID(user_id)

    return database_root().users['id', user_id]


def find_by_name(name):
    """
    Returns a single User-entity with the given `name`, or None if it could not be found.

    :param name: A string denoting the name of the user we hope to find.
    """
    return database_root().users.get('name', name, default=None)


def find_by_verification_code(verification_code):
    """
    Returns a single User-entity with the given `verification_code`, or None if it could not be found.
    The latter case might indicate that the user does not exist, or that the verification code has expired.
    :param verification_code: A VerificationCode instance denoting the verification code of the user we hope to find.
    """
    return database_root().users.get('_verification_code', verification_code, default=None)


def all():
    """
    Returns a (lazy) collection of all users (in no guaranteed order).

    >>> list(all())
    []
    >>> gandalf = User("Gandalf", "pass", 'some@email.com')
    >>> dumbledore = User("Dumbledore", "secret", 'some@email.com')
    >>> add(gandalf)
    >>> add(dumbledore)
    >>> sorted([user.name for user in all()])
    ['Dumbledore', 'Gandalf']
    >>> clear_all()
    >>> sorted([user.name for user in all()])
    []
    """
    return database_root().users.values()


def all_unverified():
    """Returns a collection of all unverified users (in no guaranteed order)."""
    return database_root().users.values('_verification_code')


def add(user):
    """
    Adds the User-entity to the repository.
    :param user: The User-entity to add.
    :raises (KeyError, DuplicateIndexError): If a user with one of the same indexes already exists within the repository.

    >>> list(all())
    []
    >>> gandalf = User("Gandalf", "pass", 'some@email.com')
    >>> dumbledore = User("Dumbledore", "secret", 'some@email.com')
    >>> add(gandalf)
    >>> add(dumbledore)
    >>> sorted([user.name for user in all()])
    ['Dumbledore', 'Gandalf']
    """
    try:
        transaction.begin()
        database_root().users.add(user)
        transaction.commit()
    except (KeyError, DuplicateIndexError):
        transaction.abort()
        raise


def _delete(user):
    """
    Removes the provided User-entity from the repository.
    :param user: The User-entity to remove.
    :raises KeyError: if the user does not exist in the repository.
    """
    try:
        transaction.begin()
        database_root().users.remove(user)
        transaction.commit()
    except KeyError:
        transaction.abort()
        raise


def delete_by_id(user_id):
    """
    Removes the User-entity whose user_id is `user_id` from the repository.
    :param user_id: The ID of the User-entity to be removed. This can be either a UUID-entity or the corresponding
        string representation.
    :raises KeyError: if the user does not exist in the repository.
      (As a side-note: this might occur when delete_by_id() is called in the middle of the deletion of the same user,
      in a multiprocessing environment.

    >>> gandalf = User("Gandalf", "pass", 'some@email.com')
    >>> add(gandalf)
    >>> find_by_name("Gandalf") == gandalf
    True
    >>> delete_by_id(gandalf.get_id())
    >>> find_by_name("Gandalf") == gandalf
    False
    """
    # Ensure that also callable with strings or integers:
    if not isinstance(user_id, uuid.UUID):
        user_id = uuid.UUID(user_id)

    try:
        user = find(user_id)
    except KeyError:
        raise
    else:
        try:  # In case user is already deleted due to potential multiprocessing issues.
            _delete(user)
        except KeyError:
            raise


def update(user):
    """
    Updates a user in the repository with the values of the provided user.
    :param user: The User instance to update its counterpart in the repository with.

    >>> gandalf = User("GandalfTheGrey", "pass", 'some@email.com')
    >>> add(gandalf)
    >>> gandalf.name = "GandalfTheWhite"
    >>> update(gandalf)
    >>> find_by_name("GandalfTheGrey") == gandalf
    False
    >>> find_by_name("GandalfTheWhite") == gandalf
    True

    """
    transaction.commit()
    for attempt in transaction.manager.attempts():
        with attempt:
            database_root().users.update_item(user)
    transaction.begin()


def clear_all():
    """
    Flushes the repository.

    >>> gandalf = User("Gandalf", "pass", 'some@email.com')
    >>> dumbledore = User("Dumbledore", "secret", 'some@email.com')
    >>> add(gandalf)
    >>> add(dumbledore)
    >>> sorted([user.name for user in all()])
    ['Dumbledore', 'Gandalf']
    >>> clear_all()
    >>> list(all())
    []
    """
    transaction.begin()
    database_root().users = MultiIndexedPersistentCollection({'id', 'name', '_verification_code'})
    transaction.commit()
