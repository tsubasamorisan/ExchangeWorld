'use strict';

const authModule = require('./auth.module');

authModule.factory('auth', auth);

/** @ngInject */
function auth(facebookService, $q, $localStorage, $mdDialog, Restangular, $rootScope) {
	var currentUser = null;

	const service = {
		login,
		logout,
		signup,
		fetchMe,
		getLoginState,
		getAccessToken,
		showEmailBox,
		isLoggedIn: () => Boolean(currentUser),
		currentUser: () => currentUser,
	};
	return service;

	/////////////

	async function login(fb, identity, password) {
		const defer = $q.defer();

		try {
			if (fb) {
				await facebookService.login(); // login to facebook.
				await fetchMe();
			} else {
				let token = await Restangular
					.all('/authenticate/login')
					.post({
						fb: false,
						identity: identity,
						password: password
					});

				updateToken(token.token);
			}
			currentUser = await Restangular.oneUrl('user/me').get();
			$rootScope.isLoggedIn = true;
			defer.resolve(currentUser);
		} catch (err) {
			defer.reject(err);
		}

		return defer.promise;
	}

	async function logout() {
		const defer = $q.defer();

		try {
			//await facebookService.logout();
			currentUser = null;
			$localStorage.user = null;
			$rootScope.isLoggedIn = false;
			updateToken(null);
			defer.resolve(null);
		} catch (err) {
			defer.reject(err);
		}

		return defer.promise;
	}

	async function signup(form) {
		const defer = $q.defer();

		try {
			let user = await Restangular.all('authenticate/register').post({
				identity: form.id,
				name: form.name,
				email: form.id,
				photo_path: 'http://exwd.csie.org/images/e59bae8cca73cd90ab5ab3a25e18ce4e612f931296e9b29227d2d5dea2b8ab7b.jpeg',
				password: form.pwd
			});

			await login(false, user.identity, form.pwd);

			defer.resolve(user);
		} catch (err) {
			defer.reject(err);
		}

		return defer.promise;
	}

	async function fetchMe() {
		const defer = $q.defer();

		try {
			let response = await facebookService.me({
				fields: 'id'
			}); // get user facebook id.
			currentUser = await facebookService.register(response); // Call API for create/get new EXWD user. 

			defer.resolve(currentUser);
		} catch (err) {
			defer.reject(err);
		}

		return defer.promise;
	}

	async function getLoginState() {
		const defer = $q.defer();

		try {
			let state = await facebookService.getLoginStatus();
			currentUser = state ? await fetchMe() : {};

			// let user fill email if email is empty
			if (currentUser && currentUser.email.length === 0) showEmailBox(currentUser);

			updateToken($localStorage.token);
			defer.resolve(currentUser);
		} catch (err) {
			defer.reject(err);
		}

		return defer.promise;
	}

	async function getAccessToken(id, pwd, fb) {
		let token = await Restangular.all('authenticate/login').post({
			fb: fb,
			identity: id,
			password: pwd
		});
		$localStorage.token = token.token;
		updateToken($localStorage.token);

		return {
			msg: 'success'
		};
	}

	function updateToken(token) {
		$localStorage.token = token;
		Restangular.setDefaultRequestParams(['get', 'remove', 'post', 'put', 'delete'], {
			token: $localStorage.token
		});
	}

	function showEmailBox(user) {
		$mdDialog.show({
			templateUrl: 'utils/auth/fillEmail.html',
			controllerAs: 'vm',
			controller: DialogController,
			locals: {
				user: user
			}
		});
	}
}

/** @ngInject */
function DialogController(user, profileService, $mdDialog, logger) {
	const vm = this;
	vm.email = '';
	vm.cancel = onCancel;
	vm.submit = onSubmit;

	function onSubmit() {
		if (vm.email) {
			user.email = vm.email;
			profileService
				.editProfile(user)
				.then(() => {
					logger.success('???????????????');
				});
		}
		$mdDialog.cancel();
	}

	function onCancel() {
		$mdDialog.cancel();
	}

}
