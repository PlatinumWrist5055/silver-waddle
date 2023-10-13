import {BlockchainsArray, blockchainName} from "../../models/Blockchains";
import * as Actions from '../../store/constants';
import BackendApiService from "../apis/BackendApiService";
import StoreService from "../utility/StoreService";

let lastPullTime;

const storeApps = res => {
	const allApps = res.reduce((acc,x) => {
		if(x.hasOwnProperty('hasimage'))
			x.img = `https://rawgit.com/GetScatter/ScatterApps/master/logos/${x.applink}.svg`

		acc[x.applink] = x;
		return acc;
	}, {});
	StoreService.get().dispatch(Actions.SET_DAPP_DATA, allApps);
}

const getAppsFromGithub = () => {
	return new Promise(resolve => {
		fetch(`https://rawgit.com/GetScatter/ScatterApps/master/apps.json?rand=${Math.random() * 10000 + 1}`).then(res => res.json()).then(result => {
			storeApps(Object.keys(result).reduce((acc, blockchain) => {
				result[blockchain].map(app => {
					acc.push(Object.assign(app, {blockchain}));
				})
				return acc;
			}, []));
			resolve(true);
		}).catch(() => resolve(false));
	})
};

const getAppsFromAPI = () => {
	return new Promise(resolve => {
		BackendApiService.apps().then(res => {
			storeApps(res);
			resolve(true);
		}).catch(() => resolve(false));
	})
};

export default class AppsService {

	/***
	 * Gets apps and binds them to state,
	 * falls back to github if API is failing.
	 * @returns {Promise<boolean>}
	 */
	static async getApps(){
		const noDapps = !Object.keys(StoreService.get().state.dappData).length;
		const dataIsStale = lastPullTime === 0 || (lastPullTime + (1000*60*60*6)) < +new Date();
		if(noDapps || dataIsStale) {
			const fetched = await getAppsFromAPI() ? true : await getAppsFromGithub();
			if (fetched) lastPullTime = +new Date();
		}

		return true;
	}

	static getAppData(origin){
		const emptyResult = {
			applink:origin,
			type:'',
			name:origin,
			description:'',
			logo:'',
			url:'',
		};

		const found = StoreService.get().state.dappData[origin];
		if(!found) return emptyResult;

		const maxDescriptionLength = 70;
		if(found.description.length > maxDescriptionLength){
			found.description = `${found.description.substr(0,70)}${found.description.length > 70 ? '...':''}`
		}

		return found;
	}

}