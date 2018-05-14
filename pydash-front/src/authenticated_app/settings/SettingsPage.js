import React, {Component} from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import ExpansionPanel, { ExpansionPanelDetails, ExpansionPanelSummary } from 'material-ui/ExpansionPanel';
import Typography from 'material-ui/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { Button } from 'material-ui';
import CreateIcon from 'material-ui-icons/Create'
import DeleteIcon from 'material-ui-icons/Delete'
import Dialog, { DialogActions, DialogContent, DialogContentText, DialogTitle,} from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import { FormGroup, FormControlLabel } from 'material-ui/Form';
import Switch from 'material-ui/Switch';
import { Redirect } from 'react-router'
import axios from 'axios';

const styles = theme => ({
  root: {
    width: '100%',
  },
  heading: {
    fontSize: theme.typography.pxToRem(23),

    flexShrink: 0,
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary,
  },
  Textpanel: {
    textAlign: 'left',
    marginLeft:'200px',
    fontSize: theme.typography.pxToRem(17),
  },

  EditDeleteIcons: {
    float:"right",
  },
  button: {
    margin: theme.spacing.unit,
  },
  leftIcon: {
    marginRight: theme.spacing.unit,
  },
  rightIcon: {
    marginLeft: theme.spacing.unit,
  },
  iconSmall: {
    fontSize: 20,
  },

});

class SettingsPage extends Component {


  state = {
    username: '',
    password:'',
    Confirmpassword:'',
    open: false,
    openDeletion: false,
    checked: true,
    SoundSettings: true,
  };
componentWillMount = () => {
    this.setState({
        isAuthenticated: this.props.isAuthenticated,
        username: this.props.username
    })
    console.log("App state: ", this.state, this.props);
}

signInHandler = (username) => {
    this.setState({
        username: username,
        isAuthenticated: true
    });
};


handleDelete = (e) => {
  e.preventDefault()

  // Make a request for deletion
  axios(window.api_path + '/api/delete',{}, {
      method: 'post',
      withCredentials: true
  }).then((response) => {
      console.log(response);
      <Redirect to="/" />
  }).catch((error) => {
      console.log('Deletion failed');
      this.handleCloseDeletion;

  });
}

  handleSettings = (e) => {
    e.preventDefault()
    axios.post(window.api_path + '/api/user/change_settings', {
      username: this.state.username,

    },{
      method: 'post',
      withCredentials: true
  }).then((response) => {
      console.log(response);
      <Redirect to="/" />
  }).catch((error) => {
      console.log('changing settings failed');
      this.handleClose;
  });
}

handlePasswords = (e) => {
  e.preventDefault()

  // Make a request for deletion
  axios(window.api_path + '/api/change_password', {},{
      method: 'post',
      withCredentials: true
  }).then((response) => {
      console.log(response);
      <Redirect to="/" />
  }).catch((error) => {
      console.log('changing password failed');
      this.handleClose;
  });
}

  handleClickOpen = () => {
    this.setState({ open: true });
  };

  handleClose = () => {
    this.setState({ open: false });
  };

  handleClickOpenDeletion = () => {
    this.setState({ openDeletion: true });
  };

  handleCloseDeletion = () => {
    this.setState({ openDeletion: false });
  };

  handleChangeSwitch = name => event => {
    this.setState({ [name]: event.target.checked });
  };

  handleChange = key => event => {
    this.setState({
        [key]: event.target.value
    });
};
  handleSoundSettings = ()=>{
    this.setState({SoundSettings: false});
  };

  render() {
    const { classes } = this.props;
    const { expanded } = this.state;

    return (

      <div className={classes.root}>
        <ExpansionPanel>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            <Typography className={classes.heading}>Personal data
            </Typography>
          </ExpansionPanelSummary>
          
        <Button variant="raised" color="primary" className={classes.EditDeleteIcons} onClick={this.handleClickOpen} >
              Edit information?
              <CreateIcon className={classes.rightIcon}/>
          </Button>
          <Typography className={classes.Textpanel}>
          Username: {this.props.username}
          <br/>

          Email: 
          <br/>

          Registration date:
          </Typography>
          <div>
        <Dialog
          open={this.state.open}
          onClose={this.handleClose}
          aria-labelledby="form-dialog-title"
        >
          <DialogTitle id="form-dialog-title">Updating personal data</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This form allows you to update your information
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="New username"
              type="username"
              onChange={this.handleChange('username')}
            />
            <Button type="submit" variant="raised" onClick={this.handleSettings} >OK</Button><br/>
            <TextField
              id="Password"
              label="Password"
              onChange={this.handleChange('password')}
              margin="dense"
              type="password"
              error={this.state.error}         
            />
            
            <TextField
              id="Confirmpassword"
              label="Confirm password"
              onChange={this.handleChange('Confirmpassword')}
              margin="normal"
              type="password"
              error={this.state.error}        
            />
            <Button variant="raised" onClick={this.handlePasswords}>OK</Button><br/>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="New email"
              type="email"     
            />
             <Button variant="raised" onClick={this.handleSettings}>OK</Button><br/>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClose}  color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>

        </ExpansionPanel>
        <ExpansionPanel>
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            <Typography className={classes.heading}>General settings</Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
          <FormControlLabel
          control={
            <Switch
              checked={this.state.checked}
              //onClick={this.handleSettings}
              onChange={this.handleChangeSwitch('checked')}
              value="checked"
              color="primary"
            />
          }
          label="Sound ON/OFF"
        />
          </ExpansionPanelDetails>
        </ExpansionPanel>
        <ExpansionPanel >
        <Button className={classes.button} variant="raised" color="secondary" onClick={this.handleClickOpenDeletion}>
        Delete account?
        <DeleteIcon className={classes.rightIcon} />
      </Button>
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            <Typography className={classes.heading}>Advanced settings</Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
          </ExpansionPanelDetails>
        </ExpansionPanel>
        <div>
        <Dialog
          open={this.state.openDeletion}
          onClose={this.handleCloseDeletion}
          aria-labelledby="form-dialog-title"
        >
          <DialogTitle id="form-dialog-title">Account deletion</DialogTitle>
          <DialogContent>
            <DialogContentText>
              WARNING: This will permanently delete your account!
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="Password"
              type="password"
            />
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="Confirm password"
              type="password"           
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleCloseDeletion} color="primary">
              Cancel
            </Button>
            <Button type="submit" onClick={this.handleDelete} color="primary">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </div>
        

      </div>
      
    );
  }
}

SettingsPage.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(SettingsPage);
