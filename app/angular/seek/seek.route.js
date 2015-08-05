
"use strict";

const seekModule = require('./seek.module');
seekModule.run(appRun);

/** @ngInject */
function appRun(routerHelper) {
	routerHelper.configureStates(getStates());
}

function getStates() {
	return [
		{
			state : 'Seek',
			config : {
				url : '/seek',
				bindToController: true,
				controller : 'SeekController',
				controllerAs: 'vm',
				templateUrl : 'seek/seek.html',
				title : 'seek'
			}
		}
	];
}