import React, { Component } from 'react';
import Button from 'material-ui/Button';
import TextField from 'material-ui/TextField';
import Dialog, {
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from 'material-ui/Dialog';

import axios from 'axios';

class AddDashboardDialog extends Component {
    constructor(props) {
        super(props);
        this.state = {
            url: '',
            name: '',
            token: '',
            message: '',
            error: false,
            loading: false,
            success: false,
        }
    }

    handleChange = key => event => {
        this.setState({
            [key]: event.target.value
        });
    };

    handleClick = () => {
        this.setState({ open: true });
    };

    handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        this.setState({ open: false });
    };

    tryCreation = (e) => {
        e.preventDefault();
        let url = this.state.url,
            name = this.state.name,
            token = this.state.token;

        if (!(url.trim()) || !(token.trim())) {
            this.setState(prevState => ({
                ...prevState,
                error: true,
                open: false,
                helperText: 'These fields are required!',
            }))

            return;
        }

        this.setState(prevState => ({
            ...prevState,
            error: false,
            helperText: '',
            loading: true
        }))

        axios.post(window.api_path + '/api/dashboards/register', {
            url,
            name,
            token},
            {withCredentials: true}
        ).then((response) => {
            console.log(response);
            this.setState(prevState => ({
                ...prevState,
                error: false,
                helperText: '',
                success: true,
                loading: false,
            }));
        }).catch((err) => {
            console.log(err);
            console.log(err.response);
            if(err.response && err.response.status === 400) {
                this.setState(prevState => ({
                    ...prevState,
                    error: true,
                    helperText: err.response.data.message,
                    loading: false,
                }));
            }
        });
        
    }

    render() {
        return (
            <div>
                <Dialog
                    open={this.props.open}
                    onClose={this.props.onClose}
                    aria-labelledby="form-dialog-title"
                >
                    <DialogTitle id="form-dialog-title">Add new dashboard</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            To add a new dashboard, we will need some information from you.
                        </DialogContentText>
                        <TextField
                            autoFocus
                            id="url"
                            label="Dashboard URL"
                            type="url"
                            fullWidth
                            required
                            error={this.state.error}
                            onChange={this.handleChange('url')}
                        />
                        <TextField
                            id="name"
                            label="Dashboard name"
                            type="text"
                            fullWidth 
                            error={this.state.error}
                            onChange={this.handleChange('name')}
                        />
                        <TextField 
                            id="token"
                            label="Security token"
                            type="password"
                            fullWidth 
                            required
                            error={this.state.error}
                            helperText={this.state.helperText}
                            onChange={this.handleChange('token')}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.props.onClose} color="default">
                            Cancel
                        </Button>
                        <Button onClick={this.tryCreation} color="primary" disabled={this.state.loading} variant="raised">
                            {this.state.loading ? "Adding dashboard" : "Save"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }

}

export default AddDashboardDialog;