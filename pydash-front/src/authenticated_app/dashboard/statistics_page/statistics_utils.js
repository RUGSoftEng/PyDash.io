import axios from 'axios';

import {dict_to_xy_arr} from "../../../utils";

async function requestStatisticData(dashboard_id, statistic, timeslice) {
    // TODO Once back-end has proper API endpoints, use that one instead of the overall one.
    axios({
        method: 'get',
        withCredentials: true,
        url: window.api_path + '/api/dashboards/' + dashboard_id + '?statistic=' + statistic + '&timeslice=' + timeslice,
    }).then((response) => {
            const timeslice_visits = dict_to_xy_arr(response.data.aggregates['unique_visitors_per_day']);
            return timeslice_visits;
    }).catch((error) => {
        console.log('error while fetching dashboard statistics data', error);
    });
}


export {requestStatisticData};
