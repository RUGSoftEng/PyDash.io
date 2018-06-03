import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';

import axios from 'axios';

// Routing:
import { Redirect } from 'react-router'
import NavLink from 'react-router-dom/NavLink';

// Visual:
import Button from 'material-ui/Button';
import TextField from 'material-ui/TextField';
import Logo from '../images/logo.png';
import Warning from '@material-ui/icons/Warning';

import IconButton from 'material-ui/IconButton';
import Visibility from 'material-ui-icons/Visibility';
import VisibilityOff from 'material-ui-icons/VisibilityOff';

// Sound:
import {Howl} from 'howler';
import login_soundfile from "./boot.mp3";

// Notifications
import { showNotification } from '../Notifier'


const login_sound = new Howl({
    src: [login_soundfile],
});

const styles = theme => ({
    close: {
        width: theme.spacing.unit * 4,
        height: theme.spacing.unit * 4,
    },
    rightIcon: {
        marginLeft: theme.spacing.unit,
      },
      textpanel: {
        marginLeft: '50px',
      },
});

class LoginPage extends Component {
    state = {
        username: '',
        password: '',
        error: false,
        message: '',
        success: false,
        loading: false,
        IsPasswordTooShort: true,
        showPassword: false,

    };

    handleChange = key => event => {
        let target_val = event.target.value;
        this.setState((prevState) => {
            let isPasswordUnsafe = prevState.isPasswordUnsafe;
            if(key === 'password') {
                console.log("TETS")
                // Only bug person once password is longer than eight characters
                // because that is a requirement in any case.
                isPasswordUnsafe = (target_val.length < 12 && target_val.length > 8);
            }
            return {
                [key]: target_val,
                isPasswordUnsafe: isPasswordUnsafe,
            }
        });
    };

    handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

    };

    handleMouseDownPassword = event => {
        event.preventDefault();
      };
    
      handleClickShowPassword = () => {
        this.setState({ showPassword: !this.state.showPassword });
      };

    tryLogin = (e) => {
        e.preventDefault()
        showNotification({ message: "Logging in..."});

        let username = this.state.username,
            password = this.state.password

        if (!(username.trim()) || !(password.trim())) {
            this.setState(prevState => ({
                ...prevState,
                error: true,
                helperText: 'Both fields are required!',
            }))
            showNotification({ message: "Login failed."});
            return;
        }

        this.setState(prevState => ({
            ...prevState,
            error: false,
            helperText: '',
            loading: true,
        }))


        // Make a request for a user with a given ID
        axios.post(window.api_path + '/api/login', {
            username,
            password},
                   {withCredentials: true},
        ).then((response) => {
            console.log(response);
            login_sound.play()
            this.props.signInHandler(username)
        }).catch((error) => {
            console.log(error);
            showNotification({ message: "Login failed."});
            if(error.response && error.response.status === 401) {
                this.setState(prevState => ({
                    error: true,
                    helperText: 'Incorrect credentials 😱',
                    loading: false,
                }))
            } else {
                this.setState(prevState => ({
                    error: true,
                    helperText: 'Unknown error returned:' + error,
                    loading: false,
                }))
            }
        });
    }

    render() {
        const { classes } = this.props;

        return this.state.success ? (
            <Redirect to="/overview" />
        ) : (
            <div>
                <header className="App-header">
                    <img alt="PyDash logo" width="200" src={Logo} />
                </header>

                <form onSubmit={this.tryLogin}>
                    <br />
                    <TextField
                        id="username"
                        label="Username"
                        value={this.state.username}
                        onChange={this.handleChange('username')}
                        margin="normal"
                        error={this.state.error}
                    />
                    <br />
                    <div >
                    <TextField className={classes.textpanel}
                        id="password"
                        label="Password"
                        value={this.state.password}
                        onChange={this.handleChange('password')}
                        margin="normal"
                        type={this.state.showPassword ? 'text' : 'password'}
                        error={this.state.error}
                        helperText={this.state.helperText}
                    />
                    <IconButton className={classes.rightIcon}

                    
                    aria-label="Toggle password visibility"
                    onClick={this.handleClickShowPassword}
                    onMouseDown={this.handleMouseDownPassword}
                    >
                    {this.state.showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                    </div>


                    {(this.state.isPasswordUnsafe ?
                      <p className="password-safety-warning" >
                          <Warning /><br/>
                          Warning! Your password is shorter than 12 characters, which is considered unsafe.<br/>
                          Please improve your password strength on the settings page after logging in.
                      </p>
                     : ""
                    )}
                    <p>
                        <Button  type="submit" variant="raised" color="primary" disabled={this.state.loading}>
                            {this.state.loading ? "Logging in..." : "Login"} 
                        </Button>
                    </p>
                    <p>
                        <Button component={NavLink} to="/register">Create an account?</Button>
                    </p>

                </form>
            </div>
        );
    }
}
LoginPage.propTypes = {
    signInHandler: PropTypes.func.isRequired,
};

export default withStyles(styles)(LoginPage);
