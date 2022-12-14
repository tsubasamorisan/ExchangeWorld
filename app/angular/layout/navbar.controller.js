'use strict';

const layoutModule = require('./layout.module');

layoutModule.controller('NavbarController', NavbarController);

/** @ngInject */
function NavbarController(
	$mdSidenav,
	$mdMenu,
	$mdDialog,
	$state,
	$scope,
	$rootScope,
	$localStorage,
	$timeout,
	$window,
	$q,
	$http,
	auth,
	message,
	logger,
	exception,
	notification,
	facebookService,
	AppSettings,
	Restangular
) {
	const vm    = this;
	vm.content             = $state.current.title;
	vm.contentIs           = (title)=> { return title === vm.content; };
	vm.openMenu            = openMenu;
	vm.closeMenu           = ()=> $mdMenu.hide();
	vm.report              = report;
	vm.menu                = menu;
	vm.onLogout            = onLogout;
	vm.notifications       = [];
	vm.messages            = [];
	vm.unread              = [0, 0];
	vm.onClickNotification = onClickNotification;
	vm.onClickMessage      = onClickMessage;


	//////////////

	// reTake access token 
	//$interval(function() {
	//auth.getAccessToken($localStorage.user.identity, null, true);
	//}, 1140000);


	activate();

	$scope.$on('$stateChangeSuccess', function(event, toState) {
		vm.content = toState.title;
		//console.log(vm.content);
	});
	$scope.$on('chatroom:msgNew', (e)=> { 
		$timeout(()=> { 
			$localStorage.user.extra_json.notification_numbers.message++;
			updateNews(); 
		});
	});
	$scope.$on('chatroom:msgRead', (e)=> { 
		$timeout(()=> { updateNews(); });
	});
	$scope.$on('notify:notifyNew', (e, data)=> { 
		$timeout(()=> { 
			$localStorage.user.extra_json.notification_numbers.notification++;
			updateNews(); 
		});
	});
	$scope.$on('notify:notifyRead', (e, idx)=> { 
		//logger.success(vm.notifications[idx].text, null, 'NEWS');
		$timeout(()=> { onClickNotification(idx); });
	});

	async function activate() {
		$rootScope.isLoggedIn = Boolean($localStorage.user);
		if ($rootScope.isLoggedIn) {
			$rootScope.user = await Restangular.one('user').one('me').get();
			$localStorage.user = $rootScope.user;

			try {
				await $http.get($rootScope.user.photo_path);
			} catch (err) {
				await facebookService.updateAvatar($rootScope.user.identity);
			}
			await updateNews();
		}

	}

	function openMenu($mdOpenMenu, e, type) {
		vm.closeMenu();
		e.preventDefault();
		e.stopPropagation();
		$mdOpenMenu(e);

		if (type) {
			onClickMsgNotifyDropdown(type);
		}
	}

	function menu(type) {
		const isFromOneCol = $state.includes("root.oneCol");

		switch (type) {
			case 'seek':
			case 'post':
				$state.go(`root.withSidenav.${type}`);
				break;

			case 'profile':
			case 'exchange':
				$state.go(`root.oneCol.${type}`, {
					uid: $localStorage.user.uid 
				});
				break;

			case 'home':
			case 'login':
			case 'signup':
			case 'm_messagebox':
			case 'm_notification':
				$state.go(`root.oneCol.${type}`);
				break;

			default:
				$state.go('404');
				break;
		}
		
		if ( 
			!isFromOneCol && 
			(!$mdSidenav('left').isOpen() || ($mdSidenav('left').isOpen() && vm.contentIs(type)))
		) {
			$mdSidenav('left').toggle();
		}

		vm.closeMenu();
	}

	function onLogout() {
		auth
			.logout()
			.then(function(){
				$state.go('root.oneCol.home');
				$localStorage.user = null;
			});
	}

	function onClickMsgNotifyDropdown(type) {
		$localStorage.user.extra_json.notification_numbers[type] = 0;
		updateIndicator();
	}

	async function onClickNotification(idx) {
		vm.notifications[idx] = await notification.click(vm.notifications[idx]);
		updateIndicator();

		if(!$state.includes("root.oneCol") && !$mdSidenav('left').isOpen() ) {
			$mdSidenav('left').toggle();
		}
		vm.closeMenu();
	}

	function onClickMessage(msg, ev) {
		message.showMessagebox(ev, msg, msg);
		vm.closeMenu();
	}

	async function updateNews() {
		if (!$rootScope.isLoggedIn) return;
		
		try {
			[vm.messages, vm.notifications] = await Promise.all([
				message.getMessageList(),
				notification.getNotification()
			]);
			updateIndicator();
		} catch (err) {
			exception.catcher('??????????????????')(err);
		}
	}

	function updateIndicator() {
		vm.unread = [
			$localStorage.user.extra_json.notification_numbers.message,
			$localStorage.user.extra_json.notification_numbers.notification
		];

		let unread = vm.unread[0] + vm.unread[1];
		$rootScope.pageTitle = (unread) ? `(${unread}) ${AppSettings.appTitle}` : AppSettings.appTitle;
	}

	function report() {
		var confirm = $mdDialog.confirm()
			.title('????????????')
			.textContent(
				'?????????BUG?????????????????????????????????????????????????????????????????????????????!')
			.ariaLabel('report')
			.ok('??????')
			.cancel('??????');
		if (confirm) {
			$mdDialog
				.show(confirm)
				.then(function() {
					$window.open('https://goo.gl/csRLdh', '_blank');
				});
		}
	}
}
