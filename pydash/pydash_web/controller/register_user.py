"""
Manages the registration of a new user.
"""

from flask import jsonify
from flask_restplus.reqparse import RequestParser

import pydash_app.user
import pydash_logger


logger = pydash_logger.Logger(__name__)

_MINIMUM_PASSWORD_LENGTH1 = 8
_MINIMUM_PASSWORD_LENGTH2 = 12


def register_user():
    args = _parse_arguments()

    username = args['username']
    password = args['password']

    print(f'args={args}')

    if not username or not password:
        message = {'message': 'Username or password missing'}
        logger.warning('User registration failed - username or password missing')
        return jsonify(message), 400

    if not _check_password_requirements(password):
        message = {'message': 'Password should consist of at least 12 characters,'
                              ' or consist of at least 8 characters,'
                              ' contain at least one capital letter'
                              ' and at least one non-alphabetic character.'}
        logger.warning('User registration failed - password does not conform to the requirements.')
        return jsonify(message), 400

    if pydash_app.user.find_by_name(username) is not None:
        message = {'message': f'User with username {username} already exists.'}
        logger.warning(f'While registering a user: {message}')
        return jsonify(message), 400
    else:
        user = pydash_app.user.User(username, password)
        pydash_app.user.add_to_repository(user)
        message = {'message': 'User successfully registered.'}
        logger.info(f'User successfully registered with username: {username}')
        return jsonify(message), 200


def _parse_arguments():
    parser = RequestParser()
    parser.add_argument('username')
    parser.add_argument('password')
    return parser.parse_args()


def _check_password_requirements(password):
    rules1 = [lambda xs: any(x.isupper() for x in xs),
              lambda xs: any(not x.isalpha() for x in xs),
              lambda xs: len(xs) >= _MINIMUM_PASSWORD_LENGTH1
              ]
    rules2 = [lambda xs:len(xs) >= _MINIMUM_PASSWORD_LENGTH2]
    alternatives = [rules1, rules2]

    def func(rules):
        return all(rule(password) for rule in rules)

    return any(func(alternative) for alternative in alternatives)
