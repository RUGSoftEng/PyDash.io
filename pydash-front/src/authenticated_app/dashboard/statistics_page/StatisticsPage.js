import React, { Component } from 'react';
import PropTypes from 'prop-types';

import axios from 'axios';
import { Redirect } from 'react-router'

// Contents:
import VisitsPanel from './VisitsPanel';
import UniqueVisitorsPanel from './UniqueVisitorsPanel';
import EndpointExecutionTimesPanel from './EndpointExecutionTimesPanel';
import EndpointsTable from '../../endpoint/EndpointsTable';
import VisitorsHeatmapPanel from './VisitorsHeatmapPanel';
import UniqueVisitorsHeatmapPanel from './UniqueVisitorsHeatmapPanel';

// Visual:
import { withStyles } from 'material-ui/styles';
import SwipeableViews from 'react-swipeable-views';
import Tabs, { Tab } from 'material-ui/Tabs';
import Typography from 'material-ui/Typography';
import DeleteIcon from 'material-ui-icons/Delete'
import CreateIcon from 'material-ui-icons/Create'
import { Button } from 'material-ui';
import Dialog, { DialogActions, DialogContent, DialogContentText, DialogTitle,} from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';

function TabContainer({ children, dir }) {
  return (
    <Typography component="div" dir={dir} style={{ padding: 8 * 3 }}>
      {children}
    </Typography>
  );
}

TabContainer.propTypes = {
  children: PropTypes.node.isRequired,
  dir: PropTypes.string.isRequired,
};

const styles = theme => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    width: 500,
  },
  settings:{
    float: "centre",
  },
});

/**
 * The main Dashboard page that cointains all general statistics we've gathered for it.
 */
class StatisticsPage extends Component {
    constructor(props) {
        super(props);
        this.divRef = React.createRef();
        this.state = {
            dashboard: null,
            dashboardName: this.props.dashboard.id,
            dashboardUrl: this.props.dashboard.url,
            dashboardToken: '',
            visits_per_day: [],
            unique_visitors_per_day: [],
            average_execution_times: [],
            error: "",
            width: 0,
            open: false,
            current_tab: 0,
        };
    }

    componentDidMount() {
        console.log(this.divRef);
        
        this.setState(prevState => {
            /* const width =  this.divRef.current.clientWidth;*/
            const width = window.screen.width;
            return {...prevState, width: width}
        })

        axios(window.api_path + '/api/dashboards/' + this.props.dashboard.id, {
            method: 'get',
            withCredentials: true
        }).then((response) => {
            console.log("Response: ", response);
            if (response.data.hasOwnProperty('error')) {
                this.setState(prevState => {
                    return {
                        ...prevState,

                        dashboard: response.data,
                        error: response.data.error,
                    }
                });
            } else {
                this.setState(prevState => {
                    return {
                        ...prevState,


                        dashboard: response.data,

                    };
                });
            }
        }).catch((error) => {
            console.log('error while fetching dashboard information', error);
        });
    }

    /* handleChange = (event, value) => {
     *     this.setState({ value });
     *   }; */
    changeTab = (event, value) => {
        this.setState({current_tab: value})
    }
    handleChange = key => event => {
        this.setState({
            [key]: event.target.value
        });
    };
    handleClickOpen = () => {
        this.setState({ open: true });
      };
    
    handleChangeIndex = index => {
        this.setState({ value: index });
    };
    handleClose = () => {
        this.setState({ open: false });
      };




    handleDelete = (e) => {
        
        e.preventDefault()
        // Make a request for deletion
        axios.post(window.api_path + '/api/dashboards/'+this.state.dashboard.id+'/delete', {
          dashboard_id: this.state.dashboard.id},
          {withCredentials: true}
        ).then((response) => {
            return <Redirect to="/" />;
        }).catch((error) => {
            console.log('Deletion failed');
        });
      }

      handleSettings = (e) => {
        
        e.preventDefault()
        // Make a request for deletion
        axios.post(window.api_path + '/api/dashboards/'+this.state.dashboard.id+'/change_settings', {
          name: this.state.dashboardName, url: this.state.dashboardUrl, token: this.state.dashboardToken},
          {withCredentials: true}
        ).then((response) => {
            return <Redirect to="/" />;
        }).catch((error) => {
            console.log('Editing failed');
        });
      }

    render() {
        const { theme } = this.props;
        if(this.props.dashboard === null || this.state.dashboard === null) {
            return (<h2>Loading...</h2>);
        }
        
        return (
            

            <div className="statistics_page" >
              <Tabs
                value={this.state.current_tab}
                onChange={this.changeTab}
                indicatorColor="primary"
                textColor="primary"
                centered
              >
                <Tab label="Statistics" />
                <Tab label="Endpoints" />
                <Tab label="Settings" />
              </Tabs>
            <SwipeableViews
              axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
              index={this.state.current_tab}
              onChangeIndex={this.handleChangeIndex}
            >
              <TabContainer dir={theme.direction}>
                 <div ref={this.divRef} >
                    <h2>Dashboard: {this.state.dashboard.url}</h2>
                    <h3 className="dashboard_error_message">{this.state.error}</h3>
                    <div>
                        <VisitsPanel dashboard_id={this.props.dashboard.id} />
                        <UniqueVisitorsPanel dashboard_id={this.props.dashboard.id} />
                        <EndpointExecutionTimesPanel dashboard_id={this.props.dashboard.id} />
                        <VisitorsHeatmapPanel dashboard_id={this.props.dashboard.id} />
                        <UniqueVisitorsHeatmapPanel dashboard_id={this.props.dashboard.id} />
                    </div>
                </div>
              </TabContainer>
              <TabContainer dir={theme.direction} >
                <div>

                    <EndpointsTable data={this.state.dashboard.endpoints} dashboard_id={this.props.dashboard.id} />
                {/*<h2>Names of endpoints:</h2>
                    <List>
                    {this.state.dashboard.endpoints.map((userData) => {
                        return (
                            <Link  to={'/overview/dashboards/'+this.props.dashboard.id+'/endpoints/'+userData.name}>
                                <ListItem>{userData.name}</ListItem>
                            </Link>
                        )
                    })}
                    </List>*/}
                    
                    
                 </div>
              </TabContainer>
              <TabContainer dir={theme.direction} className={theme.settings}>
                  <h2>Name: {this.props.dashboard.name}</h2>
                  <h2>URL: {this.props.dashboard.url}</h2>
                  <h2>Token: ···</h2>
                  <div>
        <Dialog
          open={this.state.open}
          onClose={this.handleClose}
          aria-labelledby="form-dialog-title"
        >
          <DialogTitle id="form-dialog-title">Updating dashboard information</DialogTitle>
          <DialogContent>
            <DialogContentText>
                This form allows you to change the information of the dashboard
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="New name"
              type="dashboard"
              onChange={this.handleChange('dashboardName')}
            />
            <br/>
            <TextField
              autoFocus
              margin="dense"
              id="url"
              label="New url"
              type="dashboard"
              onChange={this.handleChange('dashboardUrl')}
            />
            <br/>
               <TextField
              autoFocus
              margin="dense"
              id="name"
              label="New token"
              type="dashboard"
              onChange={this.handleChange('dashboardToken')}
            />
            
            </DialogContent>
          <DialogActions>
          <Button type="submit" variant="raised" color="primary"onClick={this.handleSettings} >OK</Button>
            <Button onClick={this.handleClose}  color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>
      <Button variant="raised" color="primary" className={theme.button} onClick={this.handleClickOpen} >
              Edit dashboard?
              <CreateIcon className={theme.rightIcon}/>
          </Button>
                  {/* <h2>Token: {this.props.dashboard.token}</h2> */}
                    <Button className={theme.button} variant="raised" color="secondary"  onClick={this.handleDelete} >
                        Delete dashboard?
                        <DeleteIcon className={theme.rightIcon} />
                    </Button>


              </TabContainer>
            </SwipeableViews>
          </div>
        );
    }
}

StatisticsPage.propTypes = {
    theme: PropTypes.object.isRequired,
    dashboard: PropTypes.shape({
        id: PropTypes.string.isRequired,
        url: PropTypes.string.isRequired,
    }).isRequired,
};


export default withStyles(styles, { withTheme: true })(StatisticsPage);
