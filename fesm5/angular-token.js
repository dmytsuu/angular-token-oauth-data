import { __values, __read } from 'tslib';
import { ActivatedRoute, Router } from '@angular/router';
import { isPlatformServer } from '@angular/common';
import { Observable, fromEvent, interval, BehaviorSubject } from 'rxjs';
import { InjectionToken, Injectable, Optional, Inject, PLATFORM_ID, NgModule, SkipSelf, defineInjectable, inject } from '@angular/core';
import { HttpClient, HttpResponse, HttpErrorResponse, HTTP_INTERCEPTORS } from '@angular/common/http';
import { pluck, filter, share, finalize, tap } from 'rxjs/operators';

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/** @type {?} */
var ANGULAR_TOKEN_OPTIONS = new InjectionToken('ANGULAR_TOKEN_OPTIONS');

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
var AngularTokenService = /** @class */ (function () {
    function AngularTokenService(http, config, platformId, activatedRoute, router) {
        this.http = http;
        this.platformId = platformId;
        this.activatedRoute = activatedRoute;
        this.router = router;
        this.userType = new BehaviorSubject(null);
        this.authData = new BehaviorSubject(null);
        this.userData = new BehaviorSubject(null);
        this.localStorage = {};
        this.global = (typeof window !== 'undefined') ? window : {};
        if (isPlatformServer(this.platformId)) {
            // Bad pratice, needs fixing
            this.global = {
                open: function () { return null; },
                location: {
                    href: '/',
                    origin: '/'
                }
            };
            // Bad pratice, needs fixing
            this.localStorage.setItem = function () { return null; };
            this.localStorage.getItem = function () { return null; };
            this.localStorage.removeItem = function () { return null; };
        }
        else {
            this.localStorage = localStorage;
        }
        /** @type {?} */
        var defaultOptions = {
            apiPath: null,
            apiBase: null,
            signInPath: 'auth/sign_in',
            signInRedirect: null,
            signInStoredUrlStorageKey: null,
            signOutPath: 'auth/sign_out',
            validateTokenPath: 'auth/validate_token',
            signOutFailedValidate: false,
            registerAccountPath: 'auth',
            deleteAccountPath: 'auth',
            registerAccountCallback: this.global.location.href,
            updatePasswordPath: 'auth',
            resetPasswordPath: 'auth/password',
            resetPasswordCallback: this.global.location.href,
            userTypes: null,
            loginField: 'email',
            oAuthBase: this.global.location.origin,
            oAuthPaths: {
                github: 'auth/github'
            },
            oAuthCallbackPath: 'oauth_callback',
            oAuthWindowType: 'newWindow',
            oAuthWindowOptions: null,
            oAuthBrowserCallbacks: {
                github: 'auth/github/callback',
            },
        };
        /** @type {?} */
        var mergedOptions = ((/** @type {?} */ (Object))).assign(defaultOptions, config);
        this.options = mergedOptions;
        if (this.options.apiBase === null) {
            console.warn("[angular-token] You have not configured 'apiBase', which may result in security issues. " +
                "Please refer to the documentation at https://github.com/neroniaky/angular-token/wiki");
        }
        this.tryLoadAuthData();
    }
    Object.defineProperty(AngularTokenService.prototype, "currentUserType", {
        get: /**
         * @return {?}
         */
        function () {
            if (this.userType.value != null) {
                return this.userType.value.name;
            }
            else {
                return undefined;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AngularTokenService.prototype, "currentUserData", {
        get: /**
         * @return {?}
         */
        function () {
            return this.userData.value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AngularTokenService.prototype, "currentAuthData", {
        get: /**
         * @return {?}
         */
        function () {
            return this.authData.value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AngularTokenService.prototype, "apiBase", {
        get: /**
         * @return {?}
         */
        function () {
            console.warn('[angular-token] The attribute .apiBase will be removed in the next major release, please use' +
                '.tokenOptions.apiBase instead');
            return this.options.apiBase;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AngularTokenService.prototype, "tokenOptions", {
        get: /**
         * @return {?}
         */
        function () {
            return this.options;
        },
        set: /**
         * @param {?} options
         * @return {?}
         */
        function (options) {
            this.options = ((/** @type {?} */ (Object))).assign(this.options, options);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @return {?}
     */
    AngularTokenService.prototype.userSignedIn = /**
     * @return {?}
     */
    function () {
        if (this.authData.value == null) {
            return false;
        }
        else {
            return true;
        }
    };
    /**
     * @param {?} route
     * @param {?} state
     * @return {?}
     */
    AngularTokenService.prototype.canActivate = /**
     * @param {?} route
     * @param {?} state
     * @return {?}
     */
    function (route, state) {
        if (this.userSignedIn()) {
            return true;
        }
        else {
            // Store current location in storage (usefull for redirection after signing in)
            if (this.options.signInStoredUrlStorageKey) {
                this.localStorage.setItem(this.options.signInStoredUrlStorageKey, state.url);
            }
            // Redirect user to sign in if signInRedirect is set
            if (this.router && this.options.signInRedirect) {
                this.router.navigate([this.options.signInRedirect]);
            }
            return false;
        }
    };
    /**
     *
     * Actions
     *
     */
    // Register request
    /**
     *
     * Actions
     *
     * @param {?} registerData
     * @param {?=} additionalData
     * @return {?}
     */
    // Register request
    AngularTokenService.prototype.registerAccount = /**
     *
     * Actions
     *
     * @param {?} registerData
     * @param {?=} additionalData
     * @return {?}
     */
    // Register request
    function (registerData, additionalData) {
        registerData = Object.assign({}, registerData);
        if (registerData.userType == null) {
            this.userType.next(null);
        }
        else {
            this.userType.next(this.getUserTypeByName(registerData.userType));
            delete registerData.userType;
        }
        if (registerData.password_confirmation == null &&
            registerData.passwordConfirmation != null) {
            registerData.password_confirmation = registerData.passwordConfirmation;
            delete registerData.passwordConfirmation;
        }
        if (additionalData !== undefined) {
            registerData.additionalData = additionalData;
        }
        /** @type {?} */
        var login = registerData.login;
        delete registerData.login;
        registerData[this.options.loginField] = login;
        registerData.confirm_success_url = this.options.registerAccountCallback;
        return this.http.post(this.getServerPath() + this.options.registerAccountPath, registerData);
    };
    // Delete Account
    // Delete Account
    /**
     * @return {?}
     */
    AngularTokenService.prototype.deleteAccount = 
    // Delete Account
    /**
     * @return {?}
     */
    function () {
        return this.http.delete(this.getServerPath() + this.options.deleteAccountPath);
    };
    // Sign in request and set storage
    // Sign in request and set storage
    /**
     * @param {?} signInData
     * @param {?=} additionalData
     * @return {?}
     */
    AngularTokenService.prototype.signIn = 
    // Sign in request and set storage
    /**
     * @param {?} signInData
     * @param {?=} additionalData
     * @return {?}
     */
    function (signInData, additionalData) {
        var _this = this;
        var _a;
        this.userType.next((signInData.userType == null) ? null : this.getUserTypeByName(signInData.userType));
        /** @type {?} */
        var body = (_a = {},
            _a[this.options.loginField] = signInData.login,
            _a.password = signInData.password,
            _a);
        if (additionalData !== undefined) {
            body.additionalData = additionalData;
        }
        /** @type {?} */
        var observ = this.http.post(this.getServerPath() + this.options.signInPath, body).pipe(share());
        observ.subscribe(function (res) { return _this.userData.next(res.data); });
        return observ;
    };
    /**
     * @param {?} oAuthType
     * @param {?=} additionalData
     * @param {?=} inAppBrowser
     * @param {?=} platform
     * @return {?}
     */
    AngularTokenService.prototype.signInOAuth = /**
     * @param {?} oAuthType
     * @param {?=} additionalData
     * @param {?=} inAppBrowser
     * @param {?=} platform
     * @return {?}
     */
    function (oAuthType, additionalData, inAppBrowser, platform) {
        var _this = this;
        /** @type {?} */
        var oAuthPath = this.getOAuthPath(oAuthType);
        /** @type {?} */
        var callbackUrl = this.global.location.origin + "/" + this.options.oAuthCallbackPath;
        /** @type {?} */
        var oAuthWindowType = this.options.oAuthWindowType;
        /** @type {?} */
        var authUrl = this.getOAuthUrl(oAuthPath, callbackUrl, oAuthWindowType, additionalData);
        if (oAuthWindowType === 'newWindow' ||
            (oAuthWindowType == 'inAppBrowser' && (!platform || !platform.is('cordova') || !(platform.is('ios') || platform.is('android'))))) {
            /** @type {?} */
            var oAuthWindowOptions = this.options.oAuthWindowOptions;
            /** @type {?} */
            var windowOptions = '';
            if (oAuthWindowOptions) {
                for (var key in oAuthWindowOptions) {
                    if (oAuthWindowOptions.hasOwnProperty(key)) {
                        windowOptions += "," + key + "=" + oAuthWindowOptions[key];
                    }
                }
            }
            /** @type {?} */
            var popup = window.open(authUrl, '_blank', "closebuttoncaption=Cancel" + windowOptions);
            return this.requestCredentialsViaPostMessage(popup);
        }
        else if (oAuthWindowType == 'inAppBrowser') {
            /** @type {?} */
            var oAuthBrowserCallback_1 = this.options.oAuthBrowserCallbacks[oAuthType];
            if (!oAuthBrowserCallback_1) {
                throw new Error("To login with oAuth provider " + oAuthType + " using inAppBrowser the callback (in oAuthBrowserCallbacks) is required.");
            }
            // let oAuthWindowOptions = this.options.oAuthWindowOptions;
            // let windowOptions = '';
            //  if (oAuthWindowOptions) {
            //     for (let key in oAuthWindowOptions) {
            //         windowOptions += `,${key}=${oAuthWindowOptions[key]}`;
            //     }
            // }
            /** @type {?} */
            var browser_1 = inAppBrowser.create(authUrl, '_blank', 'location=no');
            return new Observable(function (observer) {
                browser_1.on('loadstop').subscribe(function (ev) {
                    if (ev.url.indexOf(oAuthBrowserCallback_1) > -1) {
                        browser_1.executeScript({ code: "requestCredentials();" }).then(function (credentials) {
                            _this.getAuthDataFromPostMessage(credentials[0]);
                            /** @type {?} */
                            var pollerObserv = interval(400);
                            /** @type {?} */
                            var pollerSubscription = pollerObserv.subscribe(function () {
                                if (_this.userSignedIn()) {
                                    observer.next(_this.authData);
                                    observer.complete();
                                    pollerSubscription.unsubscribe();
                                    browser_1.close();
                                }
                            }, function (error) {
                                observer.error(error);
                                observer.complete();
                            });
                        }, function (error) {
                            observer.error(error);
                            observer.complete();
                        });
                    }
                }, function (error) {
                    observer.error(error);
                    observer.complete();
                });
            });
        }
        else if (oAuthWindowType === 'sameWindow') {
            this.global.location.href = authUrl;
            return undefined;
        }
        else {
            throw new Error("Unsupported oAuthWindowType \"" + oAuthWindowType + "\"");
        }
    };
    /**
     * @return {?}
     */
    AngularTokenService.prototype.processOAuthCallback = /**
     * @return {?}
     */
    function () {
        this.getAuthDataFromParams();
    };
    // Sign out request and delete storage
    // Sign out request and delete storage
    /**
     * @return {?}
     */
    AngularTokenService.prototype.signOut = 
    // Sign out request and delete storage
    /**
     * @return {?}
     */
    function () {
        var _this = this;
        return this.http.delete(this.getServerPath() + this.options.signOutPath)
            // Only remove the localStorage and clear the data after the call
            .pipe(finalize(function () {
            _this.localStorage.removeItem('accessToken');
            _this.localStorage.removeItem('client');
            _this.localStorage.removeItem('expiry');
            _this.localStorage.removeItem('tokenType');
            _this.localStorage.removeItem('uid');
            _this.authData.next(null);
            _this.userType.next(null);
            _this.userData.next(null);
        }));
    };
    // Validate token request
    // Validate token request
    /**
     * @return {?}
     */
    AngularTokenService.prototype.validateToken = 
    // Validate token request
    /**
     * @return {?}
     */
    function () {
        var _this = this;
        /** @type {?} */
        var observ = this.http.get(this.getServerPath() + this.options.validateTokenPath).pipe(share());
        observ.subscribe(function (res) { return _this.userData.next(res.data); }, function (error) {
            if (error.status === 401 && _this.options.signOutFailedValidate) {
                _this.signOut();
            }
        });
        return observ;
    };
    // Update password request
    // Update password request
    /**
     * @param {?} updatePasswordData
     * @return {?}
     */
    AngularTokenService.prototype.updatePassword = 
    // Update password request
    /**
     * @param {?} updatePasswordData
     * @return {?}
     */
    function (updatePasswordData) {
        if (updatePasswordData.userType != null) {
            this.userType.next(this.getUserTypeByName(updatePasswordData.userType));
        }
        /** @type {?} */
        var args;
        if (updatePasswordData.passwordCurrent == null) {
            args = {
                password: updatePasswordData.password,
                password_confirmation: updatePasswordData.passwordConfirmation
            };
        }
        else {
            args = {
                current_password: updatePasswordData.passwordCurrent,
                password: updatePasswordData.password,
                password_confirmation: updatePasswordData.passwordConfirmation
            };
        }
        if (updatePasswordData.resetPasswordToken) {
            args.reset_password_token = updatePasswordData.resetPasswordToken;
        }
        /** @type {?} */
        var body = args;
        return this.http.put(this.getServerPath() + this.options.updatePasswordPath, body);
    };
    // Reset password request
    // Reset password request
    /**
     * @param {?} resetPasswordData
     * @return {?}
     */
    AngularTokenService.prototype.resetPassword = 
    // Reset password request
    /**
     * @param {?} resetPasswordData
     * @return {?}
     */
    function (resetPasswordData) {
        var _a;
        this.userType.next((resetPasswordData.userType == null) ? null : this.getUserTypeByName(resetPasswordData.userType));
        /** @type {?} */
        var body = (_a = {},
            _a[this.options.loginField] = resetPasswordData.login,
            _a.redirect_url = this.options.resetPasswordCallback,
            _a);
        return this.http.post(this.getServerPath() + this.options.resetPasswordPath, body);
    };
    /**
     *
     * Construct Paths / Urls
     *
     */
    /**
     *
     * Construct Paths / Urls
     *
     * @private
     * @return {?}
     */
    AngularTokenService.prototype.getUserPath = /**
     *
     * Construct Paths / Urls
     *
     * @private
     * @return {?}
     */
    function () {
        return (this.userType.value == null) ? '' : this.userType.value.path + '/';
    };
    /**
     * @private
     * @return {?}
     */
    AngularTokenService.prototype.getApiPath = /**
     * @private
     * @return {?}
     */
    function () {
        /** @type {?} */
        var constructedPath = '';
        if (this.options.apiBase != null) {
            constructedPath += this.options.apiBase + '/';
        }
        if (this.options.apiPath != null) {
            constructedPath += this.options.apiPath + '/';
        }
        return constructedPath;
    };
    /**
     * @private
     * @return {?}
     */
    AngularTokenService.prototype.getServerPath = /**
     * @private
     * @return {?}
     */
    function () {
        return this.getApiPath() + this.getUserPath();
    };
    /**
     * @private
     * @param {?} oAuthType
     * @return {?}
     */
    AngularTokenService.prototype.getOAuthPath = /**
     * @private
     * @param {?} oAuthType
     * @return {?}
     */
    function (oAuthType) {
        /** @type {?} */
        var oAuthPath;
        oAuthPath = this.options.oAuthPaths[oAuthType];
        if (oAuthPath == null) {
            oAuthPath = "/auth/" + oAuthType;
        }
        return oAuthPath;
    };
    /**
     * @private
     * @param {?} oAuthPath
     * @param {?} callbackUrl
     * @param {?} windowType
     * @param {?=} additionalData
     * @return {?}
     */
    AngularTokenService.prototype.getOAuthUrl = /**
     * @private
     * @param {?} oAuthPath
     * @param {?} callbackUrl
     * @param {?} windowType
     * @param {?=} additionalData
     * @return {?}
     */
    function (oAuthPath, callbackUrl, windowType, additionalData) {
        var e_1, _a;
        /** @type {?} */
        var url;
        url = this.options.oAuthBase + "/" + oAuthPath;
        url += "?omniauth_window_type=" + windowType;
        url += "&auth_origin_url=" + encodeURIComponent(callbackUrl);
        if (additionalData) {
            try {
                for (var _b = __values(Object.entries(additionalData)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
                    url += "&" + key + "=" + value;
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        if (this.userType.value != null) {
            url += "&resource_class=" + this.userType.value.name;
        }
        return url;
    };
    /**
     *
     * Get Auth Data
     *
     */
    // Try to load auth data
    /**
     *
     * Get Auth Data
     *
     * @private
     * @return {?}
     */
    // Try to load auth data
    AngularTokenService.prototype.tryLoadAuthData = /**
     *
     * Get Auth Data
     *
     * @private
     * @return {?}
     */
    // Try to load auth data
    function () {
        /** @type {?} */
        var userType = this.getUserTypeByName(this.localStorage.getItem('userType'));
        if (userType) {
            this.userType.next(userType);
        }
        this.getAuthDataFromStorage();
        if (this.activatedRoute) {
            this.getAuthDataFromParams();
        }
        // if (this.authData) {
        //     this.validateToken();
        // }
    };
    // Parse Auth data from response
    // Parse Auth data from response
    /**
     * @param {?} data
     * @return {?}
     */
    AngularTokenService.prototype.getAuthHeadersFromResponse = 
    // Parse Auth data from response
    /**
     * @param {?} data
     * @return {?}
     */
    function (data) {
        /** @type {?} */
        var headers = data.headers;
        /** @type {?} */
        var authData = {
            accessToken: headers.get('access-token'),
            client: headers.get('client'),
            expiry: headers.get('expiry'),
            tokenType: headers.get('token-type'),
            uid: headers.get('uid')
        };
        this.setAuthData(authData);
    };
    // Parse Auth data from post message
    // Parse Auth data from post message
    /**
     * @private
     * @param {?} data
     * @return {?}
     */
    AngularTokenService.prototype.getAuthDataFromPostMessage = 
    // Parse Auth data from post message
    /**
     * @private
     * @param {?} data
     * @return {?}
     */
    function (data) {
        /** @type {?} */
        var authData = {
            accessToken: data['auth_token'],
            client: data['client_id'],
            expiry: data['expiry'],
            tokenType: 'Bearer',
            uid: data['uid']
        };
        this.setAuthData(authData);
    };
    // Try to get auth data from storage.
    // Try to get auth data from storage.
    /**
     * @return {?}
     */
    AngularTokenService.prototype.getAuthDataFromStorage = 
    // Try to get auth data from storage.
    /**
     * @return {?}
     */
    function () {
        /** @type {?} */
        var authData = {
            accessToken: this.localStorage.getItem('accessToken'),
            client: this.localStorage.getItem('client'),
            expiry: this.localStorage.getItem('expiry'),
            tokenType: this.localStorage.getItem('tokenType'),
            uid: this.localStorage.getItem('uid')
        };
        if (this.checkAuthData(authData)) {
            this.authData.next(authData);
        }
    };
    // Try to get auth data from url parameters.
    // Try to get auth data from url parameters.
    /**
     * @private
     * @return {?}
     */
    AngularTokenService.prototype.getAuthDataFromParams = 
    // Try to get auth data from url parameters.
    /**
     * @private
     * @return {?}
     */
    function () {
        var _this = this;
        this.activatedRoute.queryParams.subscribe(function (queryParams) {
            /** @type {?} */
            var authData = {
                accessToken: queryParams['token'] || queryParams['auth_token'],
                client: queryParams['client_id'],
                expiry: queryParams['expiry'],
                tokenType: 'Bearer',
                uid: queryParams['uid']
            };
            if (_this.checkAuthData(authData)) {
                _this.authData.next(authData);
            }
        });
    };
    /**
     *
     * Set Auth Data
     *
     */
    // Write auth data to storage
    /**
     *
     * Set Auth Data
     *
     * @private
     * @param {?} authData
     * @return {?}
     */
    // Write auth data to storage
    AngularTokenService.prototype.setAuthData = /**
     *
     * Set Auth Data
     *
     * @private
     * @param {?} authData
     * @return {?}
     */
    // Write auth data to storage
    function (authData) {
        if (this.checkAuthData(authData)) {
            this.authData.next(authData);
            this.localStorage.setItem('accessToken', authData.accessToken);
            this.localStorage.setItem('client', authData.client);
            this.localStorage.setItem('expiry', authData.expiry);
            this.localStorage.setItem('tokenType', authData.tokenType);
            this.localStorage.setItem('uid', authData.uid);
            if (this.userType.value != null) {
                this.localStorage.setItem('userType', this.userType.value.name);
            }
        }
    };
    /**
     *
     * Validate Auth Data
     *
     */
    // Check if auth data complete and if response token is newer
    /**
     *
     * Validate Auth Data
     *
     * @private
     * @param {?} authData
     * @return {?}
     */
    // Check if auth data complete and if response token is newer
    AngularTokenService.prototype.checkAuthData = /**
     *
     * Validate Auth Data
     *
     * @private
     * @param {?} authData
     * @return {?}
     */
    // Check if auth data complete and if response token is newer
    function (authData) {
        if (authData.accessToken != null &&
            authData.client != null &&
            authData.expiry != null &&
            authData.tokenType != null &&
            authData.uid != null) {
            if (this.authData.value != null) {
                return authData.expiry >= this.authData.value.expiry;
            }
            return true;
        }
        return false;
    };
    /**
     *
     * OAuth
     *
     */
    /**
     *
     * OAuth
     *
     * @private
     * @param {?} authWindow
     * @return {?}
     */
    AngularTokenService.prototype.requestCredentialsViaPostMessage = /**
     *
     * OAuth
     *
     * @private
     * @param {?} authWindow
     * @return {?}
     */
    function (authWindow) {
        /** @type {?} */
        var pollerObserv = interval(500);
        /** @type {?} */
        var responseObserv = fromEvent(this.global, 'message').pipe(pluck('data'), filter(this.oAuthWindowResponseFilter));
        responseObserv.subscribe(this.getAuthDataFromPostMessage.bind(this));
        /** @type {?} */
        var pollerSubscription = pollerObserv.subscribe(function () {
            if (authWindow.closed) {
                pollerSubscription.unsubscribe();
            }
            else {
                authWindow.postMessage('requestCredentials', '*');
            }
        });
        return responseObserv;
    };
    /**
     * @private
     * @param {?} data
     * @return {?}
     */
    AngularTokenService.prototype.oAuthWindowResponseFilter = /**
     * @private
     * @param {?} data
     * @return {?}
     */
    function (data) {
        if (data.message === 'deliverCredentials' || data.message === 'authFailure') {
            return data;
        }
    };
    /**
     *
     * Utilities
     *
     */
    // Match user config by user config name
    /**
     *
     * Utilities
     *
     * @private
     * @param {?} name
     * @return {?}
     */
    // Match user config by user config name
    AngularTokenService.prototype.getUserTypeByName = /**
     *
     * Utilities
     *
     * @private
     * @param {?} name
     * @return {?}
     */
    // Match user config by user config name
    function (name) {
        if (name == null || this.options.userTypes == null) {
            return null;
        }
        return this.options.userTypes.find(function (userType) { return userType.name === name; });
    };
    AngularTokenService.decorators = [
        { type: Injectable, args: [{
                    providedIn: 'root',
                },] }
    ];
    /** @nocollapse */
    AngularTokenService.ctorParameters = function () { return [
        { type: HttpClient },
        { type: undefined, decorators: [{ type: Inject, args: [ANGULAR_TOKEN_OPTIONS,] }] },
        { type: Object, decorators: [{ type: Inject, args: [PLATFORM_ID,] }] },
        { type: ActivatedRoute, decorators: [{ type: Optional }] },
        { type: Router, decorators: [{ type: Optional }] }
    ]; };
    /** @nocollapse */ AngularTokenService.ngInjectableDef = defineInjectable({ factory: function AngularTokenService_Factory() { return new AngularTokenService(inject(HttpClient), inject(ANGULAR_TOKEN_OPTIONS), inject(PLATFORM_ID), inject(ActivatedRoute, 8), inject(Router, 8)); }, token: AngularTokenService, providedIn: "root" });
    return AngularTokenService;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
var AngularTokenInterceptor = /** @class */ (function () {
    function AngularTokenInterceptor(tokenService) {
        this.tokenService = tokenService;
    }
    /**
     * @param {?} req
     * @param {?} next
     * @return {?}
     */
    AngularTokenInterceptor.prototype.intercept = /**
     * @param {?} req
     * @param {?} next
     * @return {?}
     */
    function (req, next) {
        var _this = this;
        // Get auth data from local storage
        this.tokenService.getAuthDataFromStorage();
        // Add the headers if the request is going to the configured server
        /** @type {?} */
        var authData = this.tokenService.authData.value;
        if (authData &&
            (this.tokenService.tokenOptions.apiBase === null || req.url.match(this.tokenService.tokenOptions.apiBase))) {
            /** @type {?} */
            var headers = {
                'access-token': authData.accessToken,
                'client': authData.client,
                'expiry': authData.expiry,
                'token-type': authData.tokenType,
                'uid': authData.uid
            };
            req = req.clone({
                setHeaders: headers
            });
        }
        return next.handle(req).pipe(tap(function (res) { return _this.handleResponse(res); }, function (err) { return _this.handleResponse(err); }));
    };
    // Parse Auth data from response
    // Parse Auth data from response
    /**
     * @private
     * @param {?} res
     * @return {?}
     */
    AngularTokenInterceptor.prototype.handleResponse = 
    // Parse Auth data from response
    /**
     * @private
     * @param {?} res
     * @return {?}
     */
    function (res) {
        if (res instanceof HttpResponse || res instanceof HttpErrorResponse) {
            if (this.tokenService.tokenOptions.apiBase === null || (res.url && res.url.match(this.tokenService.tokenOptions.apiBase))) {
                this.tokenService.getAuthHeadersFromResponse(res);
            }
        }
    };
    AngularTokenInterceptor.decorators = [
        { type: Injectable }
    ];
    /** @nocollapse */
    AngularTokenInterceptor.ctorParameters = function () { return [
        { type: AngularTokenService }
    ]; };
    return AngularTokenInterceptor;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
var AngularTokenModule = /** @class */ (function () {
    function AngularTokenModule(parentModule) {
        if (parentModule) {
            throw new Error('AngularToken is already loaded. It should only be imported in your application\'s main module.');
        }
    }
    /**
     * @param {?} options
     * @return {?}
     */
    AngularTokenModule.forRoot = /**
     * @param {?} options
     * @return {?}
     */
    function (options) {
        return {
            ngModule: AngularTokenModule,
            providers: [
                {
                    provide: HTTP_INTERCEPTORS,
                    useClass: AngularTokenInterceptor,
                    multi: true
                },
                options.angularTokenOptionsProvider ||
                    {
                        provide: ANGULAR_TOKEN_OPTIONS,
                        useValue: options
                    },
                AngularTokenService
            ]
        };
    };
    AngularTokenModule.decorators = [
        { type: NgModule }
    ];
    /** @nocollapse */
    AngularTokenModule.ctorParameters = function () { return [
        { type: AngularTokenModule, decorators: [{ type: Optional }, { type: SkipSelf }] }
    ]; };
    return AngularTokenModule;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

export { ANGULAR_TOKEN_OPTIONS, AngularTokenService, AngularTokenModule, AngularTokenInterceptor as ɵb, AngularTokenService as ɵa };

//# sourceMappingURL=angular-token.js.map