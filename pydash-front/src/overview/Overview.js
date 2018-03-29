import React, { Component } from 'react';
import './overview.css';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
// import AppBar from 'material-ui/AppBar';
// import Toolbar from 'material-ui/Toolbar';
// import Typography from 'material-ui/Typography';
// import Button from 'material-ui/Button';
// import IconButton from 'material-ui/IconButton';
// import MenuIcon from 'material-ui-icons/Menu';
import ResponsiveDrawer from './../dashboard/ResponsiveDrawer';
import DashTileGrid from './DashTileGrid';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import MenuIcon from 'material-ui-icons/Menu';
import IconButton from 'material-ui/IconButton';
import Typography from 'material-ui/Typography';
import Hidden from 'material-ui/Hidden';
import Drawer from 'material-ui/Drawer';
import List from 'material-ui/List';
import { mailFolderListItems, otherMailFolderListItems } from './../dashboard/tileData';
import Divider from 'material-ui/Divider';

const drawerWidth = 240;

const styles = theme => ({
    root: {
        flexGrow: 1,
        // height: 430,
        height: '100%',
        zIndex: 1,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        width: '100%',
    },
    appBar: {
        position: 'absolute',
        marginLeft: drawerWidth,
        [theme.breakpoints.up('md')]: {
            width: `calc(100% - ${drawerWidth}px)`,
        },
    },
    navIconHide: {
        [theme.breakpoints.up('md')]: {
            display: 'none',
        },
    },
    toolbar: theme.mixins.toolbar,
    drawerPaper: {
        width: drawerWidth,
        [theme.breakpoints.up('md')]: {
            position: 'relative',
        },
    },
    content: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.default,
        padding: theme.spacing.unit * 3,
    },
});

class Overview extends Component {
    state = {
        mobileOpen: false,
    };

    handleDrawerToggle = () => {
        this.setState({ mobileOpen: !this.state.mobileOpen });
    };
  
    render() {
        const {classes , theme} = this.props;
        
        const drawer = (
            <div>
                <div className={classes.toolbar} />
                <Divider />
                <List>{mailFolderListItems}</List>
                <Divider />
                <List>{otherMailFolderListItems}</List>
            </div>
        );
        
        return (
          <div className = {classes.root}>
            <AppBar className={classes.appBar}>
              <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    onClick={this.handleDrawerToggle}
                    className={classes.navIconHide}
                >
                    <MenuIcon />
                </IconButton>
                <Typography variant="title" color="inherit" noWrap>
                  PyDash.io Dashboard
                </Typography>
              </Toolbar>
            </AppBar>
            <Hidden mdUp>
                    <Drawer
                        variant="temporary"
                        anchor="left"
                        open={this.state.mobileOpen}
                        onClose={this.handleDrawerToggle}
                        classes={{
                            paper: classes.drawerPaper,
                        }}
                        ModalProps={{
                            keepMounted: true, // Better open performance on mobile.
                        }}
                    >
                        {drawer}
                    </Drawer>
                </Hidden>
                <Hidden smDown implementation="css">
                    <Drawer
                        variant="permanent"
                        open
                        classes={{
                            paper: classes.drawerPaper,
                        }}
                    >
                        {drawer}
                    </Drawer>
                </Hidden>
            <main className={classes.content}>
              <div className={classes.toolbar} />
              <DashTileGrid username='testuser' />
            </main>
          </div>
            
        );
    }
}

Overview.propTypes = {
    classes: PropTypes.object.isRequired,
    theme: PropTypes.object.isRequired,
};

export default withStyles(styles)(Overview);
