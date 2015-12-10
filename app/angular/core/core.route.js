"use strict";

const coreModule = require('./core.module');
coreModule.run(appRun);

/** @ngInject */
function appRun(routerHelper, $rootScope, AppSettings) {
	routerHelper.configureStates(getStates(), '/404');

	$rootScope.pageTitle = AppSettings.appTitle;
}

function getStates() {
	return [
		{
			state: 'root.404',
			config: {
				url: '/404',
				templateUrl: 'core/404.html',
				/** @ngInject */
				onEnter: function($state, $window, $timeout) {
					if($window.innerWidth < 600) {
						$timeout(() => {
							$state.go('root.oneCol.404');	
						});
					} else {
						$timeout(() => {
							$state.go('root.withSidenav.404');
						});
					}
				}
			}
		},
		{
			state: 'root.withSidenav.404',
			config: {
				url: '/404',
				templateUrl: 'core/404.html',
			}
		},
		{
			state: 'root.oneCol.404',
			config: {
				url: '/404',
				templateUrl: 'core/404.html',
			}
		}
	];
}
