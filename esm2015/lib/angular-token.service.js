/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { Injectable, Optional, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { Observable, fromEvent, interval, BehaviorSubject } from 'rxjs';
import { pluck, filter, share, finalize } from 'rxjs/operators';
import { ANGULAR_TOKEN_OPTIONS } from './angular-token.token';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common/http";
import * as i2 from "./angular-token.token";
import * as i3 from "@angular/router";
export class AngularTokenService {
    /**
     * @param {?} http
     * @param {?} config
     * @param {?} platformId
     * @param {?} activatedRoute
     * @param {?} router
     */
    constructor(http, config, platformId, activatedRoute, router) {
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
                open: () => null,
                location: {
                    href: '/',
                    origin: '/'
                }
            };
            // Bad pratice, needs fixing
            this.localStorage.setItem = () => null;
            this.localStorage.getItem = () => null;
            this.localStorage.removeItem = () => null;
        }
        else {
            this.localStorage = localStorage;
        }
        /** @type {?} */
        const defaultOptions = {
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
        const mergedOptions = ((/** @type {?} */ (Object))).assign(defaultOptions, config);
        this.options = mergedOptions;
        if (this.options.apiBase === null) {
            console.warn(`[angular-token] You have not configured 'apiBase', which may result in security issues. ` +
                `Please refer to the documentation at https://github.com/neroniaky/angular-token/wiki`);
        }
        this.tryLoadAuthData();
    }
    /**
     * @return {?}
     */
    get currentUserType() {
        if (this.userType.value != null) {
            return this.userType.value.name;
        }
        else {
            return undefined;
        }
    }
    /**
     * @return {?}
     */
    get currentUserData() {
        return this.userData.value;
    }
    /**
     * @return {?}
     */
    get currentAuthData() {
        return this.authData.value;
    }
    /**
     * @return {?}
     */
    get apiBase() {
        console.warn('[angular-token] The attribute .apiBase will be removed in the next major release, please use' +
            '.tokenOptions.apiBase instead');
        return this.options.apiBase;
    }
    /**
     * @return {?}
     */
    get tokenOptions() {
        return this.options;
    }
    /**
     * @param {?} options
     * @return {?}
     */
    set tokenOptions(options) {
        this.options = ((/** @type {?} */ (Object))).assign(this.options, options);
    }
    /**
     * @return {?}
     */
    userSignedIn() {
        if (this.authData.value == null) {
            return false;
        }
        else {
            return true;
        }
    }
    /**
     * @param {?} route
     * @param {?} state
     * @return {?}
     */
    canActivate(route, state) {
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
    }
    /**
     *
     * Actions
     *
     * @param {?} registerData
     * @param {?=} additionalData
     * @return {?}
     */
    // Register request
    registerAccount(registerData, additionalData) {
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
        const login = registerData.login;
        delete registerData.login;
        registerData[this.options.loginField] = login;
        registerData.confirm_success_url = this.options.registerAccountCallback;
        return this.http.post(this.getServerPath() + this.options.registerAccountPath, registerData);
    }
    // Delete Account
    /**
     * @return {?}
     */
    deleteAccount() {
        return this.http.delete(this.getServerPath() + this.options.deleteAccountPath);
    }
    // Sign in request and set storage
    /**
     * @param {?} signInData
     * @param {?=} additionalData
     * @return {?}
     */
    signIn(signInData, additionalData) {
        this.userType.next((signInData.userType == null) ? null : this.getUserTypeByName(signInData.userType));
        /** @type {?} */
        const body = {
            [this.options.loginField]: signInData.login,
            password: signInData.password
        };
        if (additionalData !== undefined) {
            body.additionalData = additionalData;
        }
        /** @type {?} */
        const observ = this.http.post(this.getServerPath() + this.options.signInPath, body).pipe(share());
        observ.subscribe(res => this.userData.next(res.data));
        return observ;
    }
    /**
     * @param {?} oAuthType
     * @param {?=} registrationToken
     * @param {?=} inAppBrowser
     * @param {?=} platform
     * @return {?}
     */
    signInOAuth(oAuthType, registrationToken, inAppBrowser, platform) {
        /** @type {?} */
        const oAuthPath = this.getOAuthPath(oAuthType);
        /** @type {?} */
        const callbackUrl = `${this.global.location.origin}/${this.options.oAuthCallbackPath}`;
        /** @type {?} */
        const oAuthWindowType = this.options.oAuthWindowType;
        /** @type {?} */
        const authUrl = this.getOAuthUrl(oAuthPath, callbackUrl, oAuthWindowType, registrationToken);
        if (oAuthWindowType === 'newWindow' ||
            (oAuthWindowType == 'inAppBrowser' && (!platform || !platform.is('cordova') || !(platform.is('ios') || platform.is('android'))))) {
            /** @type {?} */
            const oAuthWindowOptions = this.options.oAuthWindowOptions;
            /** @type {?} */
            let windowOptions = '';
            if (oAuthWindowOptions) {
                for (const key in oAuthWindowOptions) {
                    if (oAuthWindowOptions.hasOwnProperty(key)) {
                        windowOptions += `,${key}=${oAuthWindowOptions[key]}`;
                    }
                }
            }
            /** @type {?} */
            const popup = window.open(authUrl, '_blank', `closebuttoncaption=Cancel${windowOptions}`);
            return this.requestCredentialsViaPostMessage(popup);
        }
        else if (oAuthWindowType == 'inAppBrowser') {
            /** @type {?} */
            let oAuthBrowserCallback = this.options.oAuthBrowserCallbacks[oAuthType];
            if (!oAuthBrowserCallback) {
                throw new Error(`To login with oAuth provider ${oAuthType} using inAppBrowser the callback (in oAuthBrowserCallbacks) is required.`);
            }
            // let oAuthWindowOptions = this.options.oAuthWindowOptions;
            // let windowOptions = '';
            //  if (oAuthWindowOptions) {
            //     for (let key in oAuthWindowOptions) {
            //         windowOptions += `,${key}=${oAuthWindowOptions[key]}`;
            //     }
            // }
            /** @type {?} */
            let browser = inAppBrowser.create(authUrl, '_blank', 'location=no');
            return new Observable((observer) => {
                browser.on('loadstop').subscribe((ev) => {
                    if (ev.url.indexOf(oAuthBrowserCallback) > -1) {
                        browser.executeScript({ code: "requestCredentials();" }).then((credentials) => {
                            this.getAuthDataFromPostMessage(credentials[0]);
                            /** @type {?} */
                            let pollerObserv = interval(400);
                            /** @type {?} */
                            let pollerSubscription = pollerObserv.subscribe(() => {
                                if (this.userSignedIn()) {
                                    observer.next(this.authData);
                                    observer.complete();
                                    pollerSubscription.unsubscribe();
                                    browser.close();
                                }
                            }, (error) => {
                                observer.error(error);
                                observer.complete();
                            });
                        }, (error) => {
                            observer.error(error);
                            observer.complete();
                        });
                    }
                }, (error) => {
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
            throw new Error(`Unsupported oAuthWindowType "${oAuthWindowType}"`);
        }
    }
    /**
     * @return {?}
     */
    processOAuthCallback() {
        this.getAuthDataFromParams();
    }
    // Sign out request and delete storage
    /**
     * @return {?}
     */
    signOut() {
        return this.http.delete(this.getServerPath() + this.options.signOutPath)
            // Only remove the localStorage and clear the data after the call
            .pipe(finalize(() => {
            this.localStorage.removeItem('accessToken');
            this.localStorage.removeItem('client');
            this.localStorage.removeItem('expiry');
            this.localStorage.removeItem('tokenType');
            this.localStorage.removeItem('uid');
            this.authData.next(null);
            this.userType.next(null);
            this.userData.next(null);
        }));
    }
    // Validate token request
    /**
     * @return {?}
     */
    validateToken() {
        /** @type {?} */
        const observ = this.http.get(this.getServerPath() + this.options.validateTokenPath).pipe(share());
        observ.subscribe((res) => this.userData.next(res.data), (error) => {
            if (error.status === 401 && this.options.signOutFailedValidate) {
                this.signOut();
            }
        });
        return observ;
    }
    // Update password request
    /**
     * @param {?} updatePasswordData
     * @return {?}
     */
    updatePassword(updatePasswordData) {
        if (updatePasswordData.userType != null) {
            this.userType.next(this.getUserTypeByName(updatePasswordData.userType));
        }
        /** @type {?} */
        let args;
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
        const body = args;
        return this.http.put(this.getServerPath() + this.options.updatePasswordPath, body);
    }
    // Reset password request
    /**
     * @param {?} resetPasswordData
     * @return {?}
     */
    resetPassword(resetPasswordData) {
        this.userType.next((resetPasswordData.userType == null) ? null : this.getUserTypeByName(resetPasswordData.userType));
        /** @type {?} */
        const body = {
            [this.options.loginField]: resetPasswordData.login,
            redirect_url: this.options.resetPasswordCallback
        };
        return this.http.post(this.getServerPath() + this.options.resetPasswordPath, body);
    }
    /**
     *
     * Construct Paths / Urls
     *
     * @private
     * @return {?}
     */
    getUserPath() {
        return (this.userType.value == null) ? '' : this.userType.value.path + '/';
    }
    /**
     * @private
     * @return {?}
     */
    getApiPath() {
        /** @type {?} */
        let constructedPath = '';
        if (this.options.apiBase != null) {
            constructedPath += this.options.apiBase + '/';
        }
        if (this.options.apiPath != null) {
            constructedPath += this.options.apiPath + '/';
        }
        return constructedPath;
    }
    /**
     * @private
     * @return {?}
     */
    getServerPath() {
        return this.getApiPath() + this.getUserPath();
    }
    /**
     * @private
     * @param {?} oAuthType
     * @return {?}
     */
    getOAuthPath(oAuthType) {
        /** @type {?} */
        let oAuthPath;
        oAuthPath = this.options.oAuthPaths[oAuthType];
        if (oAuthPath == null) {
            oAuthPath = `/auth/${oAuthType}`;
        }
        return oAuthPath;
    }
    /**
     * @private
     * @param {?} oAuthPath
     * @param {?} callbackUrl
     * @param {?} windowType
     * @param {?=} registrationToken
     * @return {?}
     */
    getOAuthUrl(oAuthPath, callbackUrl, windowType, registrationToken) {
        /** @type {?} */
        let url;
        url = `${this.options.oAuthBase}/${oAuthPath}`;
        url += `?omniauth_window_type=${windowType}`;
        url += `&auth_origin_url=${encodeURIComponent(callbackUrl)}`;
        if (registrationToken) {
            url += `&registration_token=${registrationToken}`;
        }
        if (this.userType.value != null) {
            url += `&resource_class=${this.userType.value.name}`;
        }
        return url;
    }
    /**
     *
     * Get Auth Data
     *
     * @private
     * @return {?}
     */
    // Try to load auth data
    tryLoadAuthData() {
        /** @type {?} */
        const userType = this.getUserTypeByName(this.localStorage.getItem('userType'));
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
    }
    // Parse Auth data from response
    /**
     * @param {?} data
     * @return {?}
     */
    getAuthHeadersFromResponse(data) {
        /** @type {?} */
        const headers = data.headers;
        /** @type {?} */
        const authData = {
            accessToken: headers.get('access-token'),
            client: headers.get('client'),
            expiry: headers.get('expiry'),
            tokenType: headers.get('token-type'),
            uid: headers.get('uid')
        };
        this.setAuthData(authData);
    }
    // Parse Auth data from post message
    /**
     * @private
     * @param {?} data
     * @return {?}
     */
    getAuthDataFromPostMessage(data) {
        /** @type {?} */
        const authData = {
            accessToken: data['auth_token'],
            client: data['client_id'],
            expiry: data['expiry'],
            tokenType: 'Bearer',
            uid: data['uid']
        };
        this.setAuthData(authData);
    }
    // Try to get auth data from storage.
    /**
     * @return {?}
     */
    getAuthDataFromStorage() {
        /** @type {?} */
        const authData = {
            accessToken: this.localStorage.getItem('accessToken'),
            client: this.localStorage.getItem('client'),
            expiry: this.localStorage.getItem('expiry'),
            tokenType: this.localStorage.getItem('tokenType'),
            uid: this.localStorage.getItem('uid')
        };
        if (this.checkAuthData(authData)) {
            this.authData.next(authData);
        }
    }
    // Try to get auth data from url parameters.
    /**
     * @private
     * @return {?}
     */
    getAuthDataFromParams() {
        this.activatedRoute.queryParams.subscribe(queryParams => {
            /** @type {?} */
            const authData = {
                accessToken: queryParams['token'] || queryParams['auth_token'],
                client: queryParams['client_id'],
                expiry: queryParams['expiry'],
                tokenType: 'Bearer',
                uid: queryParams['uid']
            };
            if (this.checkAuthData(authData)) {
                this.authData.next(authData);
            }
        });
    }
    /**
     *
     * Set Auth Data
     *
     * @private
     * @param {?} authData
     * @return {?}
     */
    // Write auth data to storage
    setAuthData(authData) {
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
    }
    /**
     *
     * Validate Auth Data
     *
     * @private
     * @param {?} authData
     * @return {?}
     */
    // Check if auth data complete and if response token is newer
    checkAuthData(authData) {
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
    }
    /**
     *
     * OAuth
     *
     * @private
     * @param {?} authWindow
     * @return {?}
     */
    requestCredentialsViaPostMessage(authWindow) {
        /** @type {?} */
        const pollerObserv = interval(500);
        /** @type {?} */
        const responseObserv = fromEvent(this.global, 'message').pipe(pluck('data'), filter(this.oAuthWindowResponseFilter));
        responseObserv.subscribe(this.getAuthDataFromPostMessage.bind(this));
        /** @type {?} */
        const pollerSubscription = pollerObserv.subscribe(() => {
            if (authWindow.closed) {
                pollerSubscription.unsubscribe();
            }
            else {
                authWindow.postMessage('requestCredentials', '*');
            }
        });
        return responseObserv;
    }
    /**
     * @private
     * @param {?} data
     * @return {?}
     */
    oAuthWindowResponseFilter(data) {
        if (data.message === 'deliverCredentials' || data.message === 'authFailure') {
            return data;
        }
    }
    /**
     *
     * Utilities
     *
     * @private
     * @param {?} name
     * @return {?}
     */
    // Match user config by user config name
    getUserTypeByName(name) {
        if (name == null || this.options.userTypes == null) {
            return null;
        }
        return this.options.userTypes.find(userType => userType.name === name);
    }
}
AngularTokenService.decorators = [
    { type: Injectable, args: [{
                providedIn: 'root',
            },] }
];
/** @nocollapse */
AngularTokenService.ctorParameters = () => [
    { type: HttpClient },
    { type: undefined, decorators: [{ type: Inject, args: [ANGULAR_TOKEN_OPTIONS,] }] },
    { type: Object, decorators: [{ type: Inject, args: [PLATFORM_ID,] }] },
    { type: ActivatedRoute, decorators: [{ type: Optional }] },
    { type: Router, decorators: [{ type: Optional }] }
];
/** @nocollapse */ AngularTokenService.ngInjectableDef = i0.defineInjectable({ factory: function AngularTokenService_Factory() { return new AngularTokenService(i0.inject(i1.HttpClient), i0.inject(i2.ANGULAR_TOKEN_OPTIONS), i0.inject(i0.PLATFORM_ID), i0.inject(i3.ActivatedRoute, 8), i0.inject(i3.Router, 8)); }, token: AngularTokenService, providedIn: "root" });
if (false) {
    /**
     * @type {?}
     * @private
     */
    AngularTokenService.prototype.options;
    /** @type {?} */
    AngularTokenService.prototype.userType;
    /** @type {?} */
    AngularTokenService.prototype.authData;
    /** @type {?} */
    AngularTokenService.prototype.userData;
    /**
     * @type {?}
     * @private
     */
    AngularTokenService.prototype.global;
    /**
     * @type {?}
     * @private
     */
    AngularTokenService.prototype.localStorage;
    /**
     * @type {?}
     * @private
     */
    AngularTokenService.prototype.http;
    /**
     * @type {?}
     * @private
     */
    AngularTokenService.prototype.platformId;
    /**
     * @type {?}
     * @private
     */
    AngularTokenService.prototype.activatedRoute;
    /**
     * @type {?}
     * @private
     */
    AngularTokenService.prototype.router;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ndWxhci10b2tlbi5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vYW5ndWxhci10b2tlbi8iLCJzb3VyY2VzIjpbImxpYi9hbmd1bGFyLXRva2VuLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDMUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQTRELE1BQU0saUJBQWlCLENBQUM7QUFDbkgsT0FBTyxFQUFFLFVBQVUsRUFBbUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNuRixPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUVuRCxPQUFPLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsZUFBZSxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQ3hFLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUVoRSxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQzs7Ozs7QUFzQjlELE1BQU0sT0FBTyxtQkFBbUI7Ozs7Ozs7O0lBd0M5QixZQUNVLElBQWdCLEVBQ08sTUFBVyxFQUNiLFVBQWtCLEVBQzNCLGNBQThCLEVBQzlCLE1BQWM7UUFKMUIsU0FBSSxHQUFKLElBQUksQ0FBWTtRQUVLLGVBQVUsR0FBVixVQUFVLENBQVE7UUFDM0IsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1FBQzlCLFdBQU0sR0FBTixNQUFNLENBQVE7UUFaN0IsYUFBUSxHQUE4QixJQUFJLGVBQWUsQ0FBVyxJQUFJLENBQUMsQ0FBQztRQUMxRSxhQUFRLEdBQThCLElBQUksZUFBZSxDQUFXLElBQUksQ0FBQyxDQUFDO1FBQzFFLGFBQVEsR0FBOEIsSUFBSSxlQUFlLENBQVcsSUFBSSxDQUFDLENBQUM7UUFHekUsaUJBQVksR0FBa0IsRUFBRSxDQUFDO1FBU3ZDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxPQUFPLE1BQU0sS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFFNUQsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFFckMsNEJBQTRCO1lBQzVCLElBQUksQ0FBQyxNQUFNLEdBQUc7Z0JBQ1osSUFBSSxFQUFFLEdBQVMsRUFBRSxDQUFDLElBQUk7Z0JBQ3RCLFFBQVEsRUFBRTtvQkFDUixJQUFJLEVBQUUsR0FBRztvQkFDVCxNQUFNLEVBQUUsR0FBRztpQkFDWjthQUNGLENBQUM7WUFFRiw0QkFBNEI7WUFDNUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEdBQUcsR0FBUyxFQUFFLENBQUMsSUFBSSxDQUFDO1lBQzdDLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxHQUFHLEdBQVMsRUFBRSxDQUFDLElBQUksQ0FBQztZQUM3QyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsR0FBRyxHQUFTLEVBQUUsQ0FBQyxJQUFJLENBQUM7U0FDakQ7YUFBTTtZQUNMLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1NBQ2xDOztjQUVLLGNBQWMsR0FBd0I7WUFDMUMsT0FBTyxFQUFxQixJQUFJO1lBQ2hDLE9BQU8sRUFBcUIsSUFBSTtZQUVoQyxVQUFVLEVBQWtCLGNBQWM7WUFDMUMsY0FBYyxFQUFjLElBQUk7WUFDaEMseUJBQXlCLEVBQUcsSUFBSTtZQUVoQyxXQUFXLEVBQWlCLGVBQWU7WUFDM0MsaUJBQWlCLEVBQVcscUJBQXFCO1lBQ2pELHFCQUFxQixFQUFPLEtBQUs7WUFFakMsbUJBQW1CLEVBQVMsTUFBTTtZQUNsQyxpQkFBaUIsRUFBVyxNQUFNO1lBQ2xDLHVCQUF1QixFQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUk7WUFFckQsa0JBQWtCLEVBQVUsTUFBTTtZQUVsQyxpQkFBaUIsRUFBVyxlQUFlO1lBQzNDLHFCQUFxQixFQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUk7WUFFckQsU0FBUyxFQUFtQixJQUFJO1lBQ2hDLFVBQVUsRUFBa0IsT0FBTztZQUVuQyxTQUFTLEVBQW1CLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU07WUFDdkQsVUFBVSxFQUFFO2dCQUNWLE1BQU0sRUFBb0IsYUFBYTthQUN4QztZQUNELGlCQUFpQixFQUFXLGdCQUFnQjtZQUM1QyxlQUFlLEVBQWEsV0FBVztZQUN2QyxrQkFBa0IsRUFBVSxJQUFJO1lBRWhDLHFCQUFxQixFQUFFO2dCQUNyQixNQUFNLEVBQW9CLHNCQUFzQjthQUNqRDtTQUNGOztjQUVLLGFBQWEsR0FBRyxDQUFDLG1CQUFLLE1BQU0sRUFBQSxDQUFDLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUM7UUFDbEUsSUFBSSxDQUFDLE9BQU8sR0FBRyxhQUFhLENBQUM7UUFFN0IsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sS0FBSyxJQUFJLEVBQUU7WUFDakMsT0FBTyxDQUFDLElBQUksQ0FBQywwRkFBMEY7Z0JBQzFGLHNGQUFzRixDQUFDLENBQUM7U0FDdEc7UUFFRCxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7SUFDekIsQ0FBQzs7OztJQWhIRCxJQUFJLGVBQWU7UUFDakIsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssSUFBSSxJQUFJLEVBQUU7WUFDL0IsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7U0FDakM7YUFBTTtZQUNMLE9BQU8sU0FBUyxDQUFDO1NBQ2xCO0lBQ0gsQ0FBQzs7OztJQUVELElBQUksZUFBZTtRQUNqQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO0lBQzdCLENBQUM7Ozs7SUFFRCxJQUFJLGVBQWU7UUFDakIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztJQUM3QixDQUFDOzs7O0lBRUQsSUFBSSxPQUFPO1FBQ1QsT0FBTyxDQUFDLElBQUksQ0FBQyw4RkFBOEY7WUFDM0csK0JBQStCLENBQUMsQ0FBQztRQUNqQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO0lBQzlCLENBQUM7Ozs7SUFFRCxJQUFJLFlBQVk7UUFDZCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7SUFDdEIsQ0FBQzs7Ozs7SUFFRCxJQUFJLFlBQVksQ0FBQyxPQUE0QjtRQUMzQyxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsbUJBQUssTUFBTSxFQUFBLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUM3RCxDQUFDOzs7O0lBc0ZELFlBQVk7UUFDVixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxJQUFJLElBQUksRUFBRTtZQUMvQixPQUFPLEtBQUssQ0FBQztTQUNkO2FBQU07WUFDTCxPQUFPLElBQUksQ0FBQztTQUNiO0lBQ0gsQ0FBQzs7Ozs7O0lBRUQsV0FBVyxDQUFDLEtBQTZCLEVBQUUsS0FBMEI7UUFDbkUsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUU7WUFDdkIsT0FBTyxJQUFJLENBQUM7U0FDYjthQUFNO1lBQ0wsK0VBQStFO1lBQy9FLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyx5QkFBeUIsRUFBRTtnQkFDMUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQ3ZCLElBQUksQ0FBQyxPQUFPLENBQUMseUJBQXlCLEVBQ3RDLEtBQUssQ0FBQyxHQUFHLENBQ1YsQ0FBQzthQUNIO1lBRUQsb0RBQW9EO1lBQ3BELElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRTtnQkFDOUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7YUFDckQ7WUFFRCxPQUFPLEtBQUssQ0FBQztTQUNkO0lBQ0gsQ0FBQzs7Ozs7Ozs7OztJQVVELGVBQWUsQ0FBQyxZQUEwQixFQUFFLGNBQW9CO1FBRTlELFlBQVksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUUvQyxJQUFJLFlBQVksQ0FBQyxRQUFRLElBQUksSUFBSSxFQUFFO1lBQ2pDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzFCO2FBQU07WUFDTCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDbEUsT0FBTyxZQUFZLENBQUMsUUFBUSxDQUFDO1NBQzlCO1FBRUQsSUFDRSxZQUFZLENBQUMscUJBQXFCLElBQUksSUFBSTtZQUMxQyxZQUFZLENBQUMsb0JBQW9CLElBQUksSUFBSSxFQUN6QztZQUNBLFlBQVksQ0FBQyxxQkFBcUIsR0FBRyxZQUFZLENBQUMsb0JBQW9CLENBQUM7WUFDdkUsT0FBTyxZQUFZLENBQUMsb0JBQW9CLENBQUM7U0FDMUM7UUFFRCxJQUFJLGNBQWMsS0FBSyxTQUFTLEVBQUU7WUFDaEMsWUFBWSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7U0FDOUM7O2NBRUssS0FBSyxHQUFHLFlBQVksQ0FBQyxLQUFLO1FBQ2hDLE9BQU8sWUFBWSxDQUFDLEtBQUssQ0FBQztRQUMxQixZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxLQUFLLENBQUM7UUFFOUMsWUFBWSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsdUJBQXVCLENBQUM7UUFFeEUsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FDbkIsSUFBSSxDQUFDLGFBQWEsRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLEVBQUUsWUFBWSxDQUN0RSxDQUFDO0lBQ0osQ0FBQzs7Ozs7SUFHRCxhQUFhO1FBQ1gsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBYyxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0lBQzlGLENBQUM7Ozs7Ozs7SUFHRCxNQUFNLENBQUMsVUFBc0IsRUFBRSxjQUFvQjtRQUNqRCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDOztjQUVqRyxJQUFJLEdBQUc7WUFDWCxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUUsVUFBVSxDQUFDLEtBQUs7WUFDM0MsUUFBUSxFQUFFLFVBQVUsQ0FBQyxRQUFRO1NBQzlCO1FBRUQsSUFBSSxjQUFjLEtBQUssU0FBUyxFQUFFO1lBQ2hDLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDO1NBQ3RDOztjQUVLLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FDM0IsSUFBSSxDQUFDLGFBQWEsRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLElBQUksQ0FDckQsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFZixNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFFdEQsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQzs7Ozs7Ozs7SUFFRCxXQUFXLENBQUMsU0FBaUIsRUFBRSxpQkFBMEIsRUFBRSxZQUEwQyxFQUFFLFFBQXdCOztjQUV2SCxTQUFTLEdBQVcsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUM7O2NBQ2hELFdBQVcsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixFQUFFOztjQUNoRixlQUFlLEdBQVcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlOztjQUN0RCxPQUFPLEdBQVcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsV0FBVyxFQUFFLGVBQWUsRUFBRSxpQkFBaUIsQ0FBQztRQUVwRyxJQUFJLGVBQWUsS0FBSyxXQUFXO1lBQ2pDLENBQUMsZUFBZSxJQUFJLGNBQWMsSUFBSSxDQUFDLENBQUMsUUFBUSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxRQUFRLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFOztrQkFDNUgsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0I7O2dCQUN0RCxhQUFhLEdBQUcsRUFBRTtZQUV0QixJQUFJLGtCQUFrQixFQUFFO2dCQUN0QixLQUFLLE1BQU0sR0FBRyxJQUFJLGtCQUFrQixFQUFFO29CQUNwQyxJQUFJLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFBRTt3QkFDeEMsYUFBYSxJQUFJLElBQUksR0FBRyxJQUFJLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7cUJBQ3pEO2lCQUNGO2FBQ0Y7O2tCQUVLLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUNyQixPQUFPLEVBQ1AsUUFBUSxFQUNSLDRCQUE0QixhQUFhLEVBQUUsQ0FDOUM7WUFDRCxPQUFPLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNyRDthQUFNLElBQUksZUFBZSxJQUFJLGNBQWMsRUFBRTs7Z0JBQ3hDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUMsU0FBUyxDQUFDO1lBQ3hFLElBQUksQ0FBQyxvQkFBb0IsRUFBRTtnQkFDekIsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQ0FBZ0MsU0FBUywwRUFBMEUsQ0FBQyxDQUFDO2FBQ3RJOzs7Ozs7Ozs7Z0JBVUcsT0FBTyxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQzdCLE9BQU8sRUFDUCxRQUFRLEVBQ1IsYUFBYSxDQUNoQjtZQUVELE9BQU8sSUFBSSxVQUFVLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRTtnQkFDakMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFPLEVBQUUsRUFBRTtvQkFDM0MsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO3dCQUM3QyxPQUFPLENBQUMsYUFBYSxDQUFDLEVBQUMsSUFBSSxFQUFFLHVCQUF1QixFQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFnQixFQUFFLEVBQUU7NEJBQy9FLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7Z0NBRTVDLFlBQVksR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDOztnQ0FFNUIsa0JBQWtCLEdBQUcsWUFBWSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUU7Z0NBQ25ELElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxFQUFFO29DQUN2QixRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztvQ0FDN0IsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO29DQUVwQixrQkFBa0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQztvQ0FDakMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO2lDQUNqQjs0QkFDSCxDQUFDLEVBQUUsQ0FBQyxLQUFVLEVBQUUsRUFBRTtnQ0FDaEIsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztnQ0FDdEIsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDOzRCQUN2QixDQUFDLENBQUM7d0JBQ0gsQ0FBQyxFQUFFLENBQUMsS0FBVSxFQUFFLEVBQUU7NEJBQ2hCLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7NEJBQ3RCLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQzt3QkFDdkIsQ0FBQyxDQUFDLENBQUM7cUJBQ0g7Z0JBQ0gsQ0FBQyxFQUFFLENBQUMsS0FBVSxFQUFFLEVBQUU7b0JBQ2hCLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3RCLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDdEIsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQTtTQUNIO2FBQU0sSUFBSSxlQUFlLEtBQUssWUFBWSxFQUFFO1lBQzNDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUM7WUFDcEMsT0FBTyxTQUFTLENBQUM7U0FDbEI7YUFBTTtZQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0NBQWdDLGVBQWUsR0FBRyxDQUFDLENBQUM7U0FDckU7SUFDSCxDQUFDOzs7O0lBRUQsb0JBQW9CO1FBQ2xCLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO0lBQy9CLENBQUM7Ozs7O0lBR0QsT0FBTztRQUNMLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQWMsSUFBSSxDQUFDLGFBQWEsRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDO1lBQ25GLGlFQUFpRTthQUNoRSxJQUFJLENBQ0gsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNWLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQzVDLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzFDLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXBDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNCLENBQUMsQ0FDRixDQUNGLENBQUM7SUFDTixDQUFDOzs7OztJQUdELGFBQWE7O2NBQ0wsTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUMxQixJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FDdEQsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFZixNQUFNLENBQUMsU0FBUyxDQUNkLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQ3JDLENBQUMsS0FBSyxFQUFFLEVBQUU7WUFDUixJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssR0FBRyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMscUJBQXFCLEVBQUU7Z0JBQzlELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQzthQUNoQjtRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQzs7Ozs7O0lBR0QsY0FBYyxDQUFDLGtCQUFzQztRQUVuRCxJQUFJLGtCQUFrQixDQUFDLFFBQVEsSUFBSSxJQUFJLEVBQUU7WUFDdkMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7U0FDekU7O1lBRUcsSUFBUztRQUViLElBQUksa0JBQWtCLENBQUMsZUFBZSxJQUFJLElBQUksRUFBRTtZQUM5QyxJQUFJLEdBQUc7Z0JBQ0wsUUFBUSxFQUFnQixrQkFBa0IsQ0FBQyxRQUFRO2dCQUNuRCxxQkFBcUIsRUFBRyxrQkFBa0IsQ0FBQyxvQkFBb0I7YUFDaEUsQ0FBQztTQUNIO2FBQU07WUFDTCxJQUFJLEdBQUc7Z0JBQ0wsZ0JBQWdCLEVBQVEsa0JBQWtCLENBQUMsZUFBZTtnQkFDMUQsUUFBUSxFQUFnQixrQkFBa0IsQ0FBQyxRQUFRO2dCQUNuRCxxQkFBcUIsRUFBRyxrQkFBa0IsQ0FBQyxvQkFBb0I7YUFDaEUsQ0FBQztTQUNIO1FBRUQsSUFBSSxrQkFBa0IsQ0FBQyxrQkFBa0IsRUFBRTtZQUN6QyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsa0JBQWtCLENBQUMsa0JBQWtCLENBQUM7U0FDbkU7O2NBRUssSUFBSSxHQUFHLElBQUk7UUFDakIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBYyxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNsRyxDQUFDOzs7Ozs7SUFHRCxhQUFhLENBQUMsaUJBQW9DO1FBRWhELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUNoQixDQUFDLGlCQUFpQixDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQ2pHLENBQUM7O2NBRUksSUFBSSxHQUFHO1lBQ1gsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFLGlCQUFpQixDQUFDLEtBQUs7WUFDbEQsWUFBWSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMscUJBQXFCO1NBQ2pEO1FBRUQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBYyxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNsRyxDQUFDOzs7Ozs7OztJQVNPLFdBQVc7UUFDakIsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7SUFDN0UsQ0FBQzs7Ozs7SUFFTyxVQUFVOztZQUNaLGVBQWUsR0FBRyxFQUFFO1FBRXhCLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLElBQUksSUFBSSxFQUFFO1lBQ2hDLGVBQWUsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7U0FDL0M7UUFFRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxJQUFJLElBQUksRUFBRTtZQUNoQyxlQUFlLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDO1NBQy9DO1FBRUQsT0FBTyxlQUFlLENBQUM7SUFDekIsQ0FBQzs7Ozs7SUFFTyxhQUFhO1FBQ25CLE9BQU8sSUFBSSxDQUFDLFVBQVUsRUFBRSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUNoRCxDQUFDOzs7Ozs7SUFFTyxZQUFZLENBQUMsU0FBaUI7O1lBQ2hDLFNBQWlCO1FBRXJCLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUUvQyxJQUFJLFNBQVMsSUFBSSxJQUFJLEVBQUU7WUFDckIsU0FBUyxHQUFHLFNBQVMsU0FBUyxFQUFFLENBQUM7U0FDbEM7UUFFRCxPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDOzs7Ozs7Ozs7SUFFTyxXQUFXLENBQUMsU0FBaUIsRUFBRSxXQUFtQixFQUFFLFVBQWtCLEVBQUUsaUJBQTBCOztZQUNwRyxHQUFXO1FBRWYsR0FBRyxHQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLElBQUksU0FBUyxFQUFFLENBQUM7UUFDakQsR0FBRyxJQUFLLHlCQUF5QixVQUFVLEVBQUUsQ0FBQztRQUM5QyxHQUFHLElBQUssb0JBQW9CLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7UUFFOUQsSUFBSSxpQkFBaUIsRUFBRTtZQUNyQixHQUFHLElBQUksdUJBQXVCLGlCQUFpQixFQUFFLENBQUM7U0FDbkQ7UUFFRCxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxJQUFJLElBQUksRUFBRTtZQUMvQixHQUFHLElBQUksbUJBQW1CLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1NBQ3REO1FBRUQsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDOzs7Ozs7Ozs7SUFVTyxlQUFlOztjQUVmLFFBQVEsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFOUUsSUFBSSxRQUFRLEVBQUU7WUFDWixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUM5QjtRQUVELElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1FBRTlCLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRTtZQUN2QixJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztTQUM5QjtRQUVELHVCQUF1QjtRQUN2Qiw0QkFBNEI7UUFDNUIsSUFBSTtJQUNOLENBQUM7Ozs7OztJQUdNLDBCQUEwQixDQUFDLElBQTJDOztjQUNyRSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU87O2NBRXRCLFFBQVEsR0FBYTtZQUN6QixXQUFXLEVBQUssT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUM7WUFDM0MsTUFBTSxFQUFVLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO1lBQ3JDLE1BQU0sRUFBVSxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQztZQUNyQyxTQUFTLEVBQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUM7WUFDekMsR0FBRyxFQUFhLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO1NBQ25DO1FBRUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUM3QixDQUFDOzs7Ozs7O0lBR08sMEJBQTBCLENBQUMsSUFBUzs7Y0FDcEMsUUFBUSxHQUFhO1lBQ3pCLFdBQVcsRUFBSyxJQUFJLENBQUMsWUFBWSxDQUFDO1lBQ2xDLE1BQU0sRUFBVSxJQUFJLENBQUMsV0FBVyxDQUFDO1lBQ2pDLE1BQU0sRUFBVSxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQzlCLFNBQVMsRUFBTyxRQUFRO1lBQ3hCLEdBQUcsRUFBYSxJQUFJLENBQUMsS0FBSyxDQUFDO1NBQzVCO1FBRUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUM3QixDQUFDOzs7OztJQUdNLHNCQUFzQjs7Y0FFckIsUUFBUSxHQUFhO1lBQ3pCLFdBQVcsRUFBSyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUM7WUFDeEQsTUFBTSxFQUFVLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQztZQUNuRCxNQUFNLEVBQVUsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDO1lBQ25ELFNBQVMsRUFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUM7WUFDdEQsR0FBRyxFQUFhLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztTQUNqRDtRQUVELElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNoQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUM5QjtJQUNILENBQUM7Ozs7OztJQUdPLHFCQUFxQjtRQUMzQixJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLEVBQUU7O2tCQUNoRCxRQUFRLEdBQWE7Z0JBQ3pCLFdBQVcsRUFBSyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksV0FBVyxDQUFDLFlBQVksQ0FBQztnQkFDakUsTUFBTSxFQUFVLFdBQVcsQ0FBQyxXQUFXLENBQUM7Z0JBQ3hDLE1BQU0sRUFBVSxXQUFXLENBQUMsUUFBUSxDQUFDO2dCQUNyQyxTQUFTLEVBQU8sUUFBUTtnQkFDeEIsR0FBRyxFQUFhLFdBQVcsQ0FBQyxLQUFLLENBQUM7YUFDbkM7WUFFRCxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQ2hDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQzlCO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDOzs7Ozs7Ozs7O0lBU08sV0FBVyxDQUFDLFFBQWtCO1FBQ3BDLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUVoQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUU3QixJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQy9ELElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDckQsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNyRCxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzNELElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFL0MsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssSUFBSSxJQUFJLEVBQUU7Z0JBQy9CLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNqRTtTQUVGO0lBQ0gsQ0FBQzs7Ozs7Ozs7OztJQVVPLGFBQWEsQ0FBQyxRQUFrQjtRQUV0QyxJQUNFLFFBQVEsQ0FBQyxXQUFXLElBQUksSUFBSTtZQUM1QixRQUFRLENBQUMsTUFBTSxJQUFJLElBQUk7WUFDdkIsUUFBUSxDQUFDLE1BQU0sSUFBSSxJQUFJO1lBQ3ZCLFFBQVEsQ0FBQyxTQUFTLElBQUksSUFBSTtZQUMxQixRQUFRLENBQUMsR0FBRyxJQUFJLElBQUksRUFDcEI7WUFDQSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxJQUFJLElBQUksRUFBRTtnQkFDL0IsT0FBTyxRQUFRLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQzthQUN0RDtZQUNELE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7Ozs7Ozs7OztJQVNPLGdDQUFnQyxDQUFDLFVBQWU7O2NBQ2hELFlBQVksR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDOztjQUU1QixjQUFjLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUMzRCxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQ2IsTUFBTSxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxDQUN2QztRQUVELGNBQWMsQ0FBQyxTQUFTLENBQ3RCLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQzNDLENBQUM7O2NBRUksa0JBQWtCLEdBQUcsWUFBWSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUU7WUFDckQsSUFBSSxVQUFVLENBQUMsTUFBTSxFQUFFO2dCQUNyQixrQkFBa0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQzthQUNsQztpQkFBTTtnQkFDTCxVQUFVLENBQUMsV0FBVyxDQUFDLG9CQUFvQixFQUFFLEdBQUcsQ0FBQyxDQUFDO2FBQ25EO1FBQ0gsQ0FBQyxDQUFDO1FBRUYsT0FBTyxjQUFjLENBQUM7SUFDeEIsQ0FBQzs7Ozs7O0lBRU8seUJBQXlCLENBQUMsSUFBUztRQUN6QyxJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssb0JBQW9CLElBQUksSUFBSSxDQUFDLE9BQU8sS0FBSyxhQUFhLEVBQUU7WUFDM0UsT0FBTyxJQUFJLENBQUM7U0FDYjtJQUNILENBQUM7Ozs7Ozs7Ozs7SUFVTyxpQkFBaUIsQ0FBQyxJQUFZO1FBQ3BDLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsSUFBSSxJQUFJLEVBQUU7WUFDbEQsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUNoQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUNuQyxDQUFDO0lBQ0osQ0FBQzs7O1lBNW5CRixVQUFVLFNBQUM7Z0JBQ1YsVUFBVSxFQUFFLE1BQU07YUFDbkI7Ozs7WUEzQlEsVUFBVTs0Q0FzRWQsTUFBTSxTQUFDLHFCQUFxQjtZQUNZLE1BQU0sdUJBQTlDLE1BQU0sU0FBQyxXQUFXO1lBeEVkLGNBQWMsdUJBeUVsQixRQUFRO1lBekVZLE1BQU0sdUJBMEUxQixRQUFROzs7Ozs7OztJQWJYLHNDQUFxQzs7SUFDckMsdUNBQWlGOztJQUNqRix1Q0FBaUY7O0lBQ2pGLHVDQUFpRjs7Ozs7SUFDakYscUNBQTZCOzs7OztJQUU3QiwyQ0FBeUM7Ozs7O0lBR3ZDLG1DQUF3Qjs7Ozs7SUFFeEIseUNBQStDOzs7OztJQUMvQyw2Q0FBa0Q7Ozs7O0lBQ2xELHFDQUFrQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUsIE9wdGlvbmFsLCBJbmplY3QsIFBMQVRGT1JNX0lEIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBBY3RpdmF0ZWRSb3V0ZSwgUm91dGVyLCBDYW5BY3RpdmF0ZSwgQWN0aXZhdGVkUm91dGVTbmFwc2hvdCwgUm91dGVyU3RhdGVTbmFwc2hvdCB9IGZyb20gJ0Bhbmd1bGFyL3JvdXRlcic7XG5pbXBvcnQgeyBIdHRwQ2xpZW50LCBIdHRwUmVzcG9uc2UsIEh0dHBFcnJvclJlc3BvbnNlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgaXNQbGF0Zm9ybVNlcnZlciB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5cbmltcG9ydCB7IE9ic2VydmFibGUsIGZyb21FdmVudCwgaW50ZXJ2YWwsIEJlaGF2aW9yU3ViamVjdCB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgcGx1Y2ssIGZpbHRlciwgc2hhcmUsIGZpbmFsaXplIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5pbXBvcnQgeyBBTkdVTEFSX1RPS0VOX09QVElPTlMgfSBmcm9tICcuL2FuZ3VsYXItdG9rZW4udG9rZW4nO1xuXG5pbXBvcnQge1xuICBTaWduSW5EYXRhLFxuICBSZWdpc3RlckRhdGEsXG4gIFVwZGF0ZVBhc3N3b3JkRGF0YSxcbiAgUmVzZXRQYXNzd29yZERhdGEsXG5cbiAgVXNlclR5cGUsXG4gIFVzZXJEYXRhLFxuICBBdXRoRGF0YSxcbiAgQXBpUmVzcG9uc2UsXG5cbiAgQW5ndWxhclRva2VuT3B0aW9ucyxcblxuICBUb2tlblBsYXRmb3JtLFxuICBUb2tlbkluQXBwQnJvd3Nlcixcbn0gZnJvbSAnLi9hbmd1bGFyLXRva2VuLm1vZGVsJztcblxuQEluamVjdGFibGUoe1xuICBwcm92aWRlZEluOiAncm9vdCcsXG59KVxuZXhwb3J0IGNsYXNzIEFuZ3VsYXJUb2tlblNlcnZpY2UgaW1wbGVtZW50cyBDYW5BY3RpdmF0ZSB7XG5cbiAgZ2V0IGN1cnJlbnRVc2VyVHlwZSgpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLnVzZXJUeXBlLnZhbHVlICE9IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLnVzZXJUeXBlLnZhbHVlLm5hbWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGN1cnJlbnRVc2VyRGF0YSgpOiBVc2VyRGF0YSB7XG4gICAgcmV0dXJuIHRoaXMudXNlckRhdGEudmFsdWU7XG4gIH1cblxuICBnZXQgY3VycmVudEF1dGhEYXRhKCk6IEF1dGhEYXRhIHtcbiAgICByZXR1cm4gdGhpcy5hdXRoRGF0YS52YWx1ZTtcbiAgfVxuXG4gIGdldCBhcGlCYXNlKCk6IHN0cmluZyB7XG4gICAgY29uc29sZS53YXJuKCdbYW5ndWxhci10b2tlbl0gVGhlIGF0dHJpYnV0ZSAuYXBpQmFzZSB3aWxsIGJlIHJlbW92ZWQgaW4gdGhlIG5leHQgbWFqb3IgcmVsZWFzZSwgcGxlYXNlIHVzZScgK1xuICAgICcudG9rZW5PcHRpb25zLmFwaUJhc2UgaW5zdGVhZCcpO1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuYXBpQmFzZTtcbiAgfVxuXG4gIGdldCB0b2tlbk9wdGlvbnMoKTogQW5ndWxhclRva2VuT3B0aW9ucyB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucztcbiAgfVxuXG4gIHNldCB0b2tlbk9wdGlvbnMob3B0aW9uczogQW5ndWxhclRva2VuT3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9ICg8YW55Pk9iamVjdCkuYXNzaWduKHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG4gIH1cblxuICBwcml2YXRlIG9wdGlvbnM6IEFuZ3VsYXJUb2tlbk9wdGlvbnM7XG4gIHB1YmxpYyB1c2VyVHlwZTogQmVoYXZpb3JTdWJqZWN0PFVzZXJUeXBlPiA9IG5ldyBCZWhhdmlvclN1YmplY3Q8VXNlclR5cGU+KG51bGwpO1xuICBwdWJsaWMgYXV0aERhdGE6IEJlaGF2aW9yU3ViamVjdDxBdXRoRGF0YT4gPSBuZXcgQmVoYXZpb3JTdWJqZWN0PEF1dGhEYXRhPihudWxsKTtcbiAgcHVibGljIHVzZXJEYXRhOiBCZWhhdmlvclN1YmplY3Q8VXNlckRhdGE+ID0gbmV3IEJlaGF2aW9yU3ViamVjdDxVc2VyRGF0YT4obnVsbCk7XG4gIHByaXZhdGUgZ2xvYmFsOiBXaW5kb3cgfCBhbnk7XG5cbiAgcHJpdmF0ZSBsb2NhbFN0b3JhZ2U6IFN0b3JhZ2UgfCBhbnkgPSB7fTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIGh0dHA6IEh0dHBDbGllbnQsXG4gICAgQEluamVjdChBTkdVTEFSX1RPS0VOX09QVElPTlMpIGNvbmZpZzogYW55LFxuICAgIEBJbmplY3QoUExBVEZPUk1fSUQpIHByaXZhdGUgcGxhdGZvcm1JZDogT2JqZWN0LFxuICAgIEBPcHRpb25hbCgpIHByaXZhdGUgYWN0aXZhdGVkUm91dGU6IEFjdGl2YXRlZFJvdXRlLFxuICAgIEBPcHRpb25hbCgpIHByaXZhdGUgcm91dGVyOiBSb3V0ZXJcbiAgKSB7XG4gICAgdGhpcy5nbG9iYWwgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpID8gd2luZG93IDoge307XG5cbiAgICBpZiAoaXNQbGF0Zm9ybVNlcnZlcih0aGlzLnBsYXRmb3JtSWQpKSB7XG5cbiAgICAgIC8vIEJhZCBwcmF0aWNlLCBuZWVkcyBmaXhpbmdcbiAgICAgIHRoaXMuZ2xvYmFsID0ge1xuICAgICAgICBvcGVuOiAoKTogdm9pZCA9PiBudWxsLFxuICAgICAgICBsb2NhdGlvbjoge1xuICAgICAgICAgIGhyZWY6ICcvJyxcbiAgICAgICAgICBvcmlnaW46ICcvJ1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAvLyBCYWQgcHJhdGljZSwgbmVlZHMgZml4aW5nXG4gICAgICB0aGlzLmxvY2FsU3RvcmFnZS5zZXRJdGVtID0gKCk6IHZvaWQgPT4gbnVsbDtcbiAgICAgIHRoaXMubG9jYWxTdG9yYWdlLmdldEl0ZW0gPSAoKTogdm9pZCA9PiBudWxsO1xuICAgICAgdGhpcy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSA9ICgpOiB2b2lkID0+IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubG9jYWxTdG9yYWdlID0gbG9jYWxTdG9yYWdlO1xuICAgIH1cblxuICAgIGNvbnN0IGRlZmF1bHRPcHRpb25zOiBBbmd1bGFyVG9rZW5PcHRpb25zID0ge1xuICAgICAgYXBpUGF0aDogICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICBhcGlCYXNlOiAgICAgICAgICAgICAgICAgICAgbnVsbCxcblxuICAgICAgc2lnbkluUGF0aDogICAgICAgICAgICAgICAgICdhdXRoL3NpZ25faW4nLFxuICAgICAgc2lnbkluUmVkaXJlY3Q6ICAgICAgICAgICAgIG51bGwsXG4gICAgICBzaWduSW5TdG9yZWRVcmxTdG9yYWdlS2V5OiAgbnVsbCxcblxuICAgICAgc2lnbk91dFBhdGg6ICAgICAgICAgICAgICAgICdhdXRoL3NpZ25fb3V0JyxcbiAgICAgIHZhbGlkYXRlVG9rZW5QYXRoOiAgICAgICAgICAnYXV0aC92YWxpZGF0ZV90b2tlbicsXG4gICAgICBzaWduT3V0RmFpbGVkVmFsaWRhdGU6ICAgICAgZmFsc2UsXG5cbiAgICAgIHJlZ2lzdGVyQWNjb3VudFBhdGg6ICAgICAgICAnYXV0aCcsXG4gICAgICBkZWxldGVBY2NvdW50UGF0aDogICAgICAgICAgJ2F1dGgnLFxuICAgICAgcmVnaXN0ZXJBY2NvdW50Q2FsbGJhY2s6ICAgIHRoaXMuZ2xvYmFsLmxvY2F0aW9uLmhyZWYsXG5cbiAgICAgIHVwZGF0ZVBhc3N3b3JkUGF0aDogICAgICAgICAnYXV0aCcsXG5cbiAgICAgIHJlc2V0UGFzc3dvcmRQYXRoOiAgICAgICAgICAnYXV0aC9wYXNzd29yZCcsXG4gICAgICByZXNldFBhc3N3b3JkQ2FsbGJhY2s6ICAgICAgdGhpcy5nbG9iYWwubG9jYXRpb24uaHJlZixcblxuICAgICAgdXNlclR5cGVzOiAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICBsb2dpbkZpZWxkOiAgICAgICAgICAgICAgICAgJ2VtYWlsJyxcblxuICAgICAgb0F1dGhCYXNlOiAgICAgICAgICAgICAgICAgIHRoaXMuZ2xvYmFsLmxvY2F0aW9uLm9yaWdpbixcbiAgICAgIG9BdXRoUGF0aHM6IHtcbiAgICAgICAgZ2l0aHViOiAgICAgICAgICAgICAgICAgICAnYXV0aC9naXRodWInXG4gICAgICB9LFxuICAgICAgb0F1dGhDYWxsYmFja1BhdGg6ICAgICAgICAgICdvYXV0aF9jYWxsYmFjaycsXG4gICAgICBvQXV0aFdpbmRvd1R5cGU6ICAgICAgICAgICAgJ25ld1dpbmRvdycsXG4gICAgICBvQXV0aFdpbmRvd09wdGlvbnM6ICAgICAgICAgbnVsbCxcblxuICAgICAgb0F1dGhCcm93c2VyQ2FsbGJhY2tzOiB7XG4gICAgICAgIGdpdGh1YjogICAgICAgICAgICAgICAgICAgJ2F1dGgvZ2l0aHViL2NhbGxiYWNrJyxcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIGNvbnN0IG1lcmdlZE9wdGlvbnMgPSAoPGFueT5PYmplY3QpLmFzc2lnbihkZWZhdWx0T3B0aW9ucywgY29uZmlnKTtcbiAgICB0aGlzLm9wdGlvbnMgPSBtZXJnZWRPcHRpb25zO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5hcGlCYXNlID09PSBudWxsKSB7XG4gICAgICBjb25zb2xlLndhcm4oYFthbmd1bGFyLXRva2VuXSBZb3UgaGF2ZSBub3QgY29uZmlndXJlZCAnYXBpQmFzZScsIHdoaWNoIG1heSByZXN1bHQgaW4gc2VjdXJpdHkgaXNzdWVzLiBgICtcbiAgICAgICAgICAgICAgICAgICBgUGxlYXNlIHJlZmVyIHRvIHRoZSBkb2N1bWVudGF0aW9uIGF0IGh0dHBzOi8vZ2l0aHViLmNvbS9uZXJvbmlha3kvYW5ndWxhci10b2tlbi93aWtpYCk7XG4gICAgfVxuXG4gICAgdGhpcy50cnlMb2FkQXV0aERhdGEoKTtcbiAgfVxuXG4gIHVzZXJTaWduZWRJbigpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5hdXRoRGF0YS52YWx1ZSA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGNhbkFjdGl2YXRlKHJvdXRlOiBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90LCBzdGF0ZTogUm91dGVyU3RhdGVTbmFwc2hvdCk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLnVzZXJTaWduZWRJbigpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gU3RvcmUgY3VycmVudCBsb2NhdGlvbiBpbiBzdG9yYWdlICh1c2VmdWxsIGZvciByZWRpcmVjdGlvbiBhZnRlciBzaWduaW5nIGluKVxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5zaWduSW5TdG9yZWRVcmxTdG9yYWdlS2V5KSB7XG4gICAgICAgIHRoaXMubG9jYWxTdG9yYWdlLnNldEl0ZW0oXG4gICAgICAgICAgdGhpcy5vcHRpb25zLnNpZ25JblN0b3JlZFVybFN0b3JhZ2VLZXksXG4gICAgICAgICAgc3RhdGUudXJsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIC8vIFJlZGlyZWN0IHVzZXIgdG8gc2lnbiBpbiBpZiBzaWduSW5SZWRpcmVjdCBpcyBzZXRcbiAgICAgIGlmICh0aGlzLnJvdXRlciAmJiB0aGlzLm9wdGlvbnMuc2lnbkluUmVkaXJlY3QpIHtcbiAgICAgICAgdGhpcy5yb3V0ZXIubmF2aWdhdGUoW3RoaXMub3B0aW9ucy5zaWduSW5SZWRpcmVjdF0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cblxuICAvKipcbiAgICpcbiAgICogQWN0aW9uc1xuICAgKlxuICAgKi9cblxuICAvLyBSZWdpc3RlciByZXF1ZXN0XG4gIHJlZ2lzdGVyQWNjb3VudChyZWdpc3RlckRhdGE6IFJlZ2lzdGVyRGF0YSwgYWRkaXRpb25hbERhdGE/OiBhbnkpOiBPYnNlcnZhYmxlPEFwaVJlc3BvbnNlPiB7XG5cbiAgICByZWdpc3RlckRhdGEgPSBPYmplY3QuYXNzaWduKHt9LCByZWdpc3RlckRhdGEpO1xuXG4gICAgaWYgKHJlZ2lzdGVyRGF0YS51c2VyVHlwZSA9PSBudWxsKSB7XG4gICAgICB0aGlzLnVzZXJUeXBlLm5leHQobnVsbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudXNlclR5cGUubmV4dCh0aGlzLmdldFVzZXJUeXBlQnlOYW1lKHJlZ2lzdGVyRGF0YS51c2VyVHlwZSkpO1xuICAgICAgZGVsZXRlIHJlZ2lzdGVyRGF0YS51c2VyVHlwZTtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICByZWdpc3RlckRhdGEucGFzc3dvcmRfY29uZmlybWF0aW9uID09IG51bGwgJiZcbiAgICAgIHJlZ2lzdGVyRGF0YS5wYXNzd29yZENvbmZpcm1hdGlvbiAhPSBudWxsXG4gICAgKSB7XG4gICAgICByZWdpc3RlckRhdGEucGFzc3dvcmRfY29uZmlybWF0aW9uID0gcmVnaXN0ZXJEYXRhLnBhc3N3b3JkQ29uZmlybWF0aW9uO1xuICAgICAgZGVsZXRlIHJlZ2lzdGVyRGF0YS5wYXNzd29yZENvbmZpcm1hdGlvbjtcbiAgICB9XG5cbiAgICBpZiAoYWRkaXRpb25hbERhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmVnaXN0ZXJEYXRhLmFkZGl0aW9uYWxEYXRhID0gYWRkaXRpb25hbERhdGE7XG4gICAgfVxuXG4gICAgY29uc3QgbG9naW4gPSByZWdpc3RlckRhdGEubG9naW47XG4gICAgZGVsZXRlIHJlZ2lzdGVyRGF0YS5sb2dpbjtcbiAgICByZWdpc3RlckRhdGFbdGhpcy5vcHRpb25zLmxvZ2luRmllbGRdID0gbG9naW47XG5cbiAgICByZWdpc3RlckRhdGEuY29uZmlybV9zdWNjZXNzX3VybCA9IHRoaXMub3B0aW9ucy5yZWdpc3RlckFjY291bnRDYWxsYmFjaztcblxuICAgIHJldHVybiB0aGlzLmh0dHAucG9zdDxBcGlSZXNwb25zZT4oXG4gICAgICB0aGlzLmdldFNlcnZlclBhdGgoKSArIHRoaXMub3B0aW9ucy5yZWdpc3RlckFjY291bnRQYXRoLCByZWdpc3RlckRhdGFcbiAgICApO1xuICB9XG5cbiAgLy8gRGVsZXRlIEFjY291bnRcbiAgZGVsZXRlQWNjb3VudCgpOiBPYnNlcnZhYmxlPEFwaVJlc3BvbnNlPiB7XG4gICAgcmV0dXJuIHRoaXMuaHR0cC5kZWxldGU8QXBpUmVzcG9uc2U+KHRoaXMuZ2V0U2VydmVyUGF0aCgpICsgdGhpcy5vcHRpb25zLmRlbGV0ZUFjY291bnRQYXRoKTtcbiAgfVxuXG4gIC8vIFNpZ24gaW4gcmVxdWVzdCBhbmQgc2V0IHN0b3JhZ2VcbiAgc2lnbkluKHNpZ25JbkRhdGE6IFNpZ25JbkRhdGEsIGFkZGl0aW9uYWxEYXRhPzogYW55KTogT2JzZXJ2YWJsZTxBcGlSZXNwb25zZT4ge1xuICAgIHRoaXMudXNlclR5cGUubmV4dCgoc2lnbkluRGF0YS51c2VyVHlwZSA9PSBudWxsKSA/IG51bGwgOiB0aGlzLmdldFVzZXJUeXBlQnlOYW1lKHNpZ25JbkRhdGEudXNlclR5cGUpKTtcblxuICAgIGNvbnN0IGJvZHkgPSB7XG4gICAgICBbdGhpcy5vcHRpb25zLmxvZ2luRmllbGRdOiBzaWduSW5EYXRhLmxvZ2luLFxuICAgICAgcGFzc3dvcmQ6IHNpZ25JbkRhdGEucGFzc3dvcmRcbiAgICB9O1xuXG4gICAgaWYgKGFkZGl0aW9uYWxEYXRhICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGJvZHkuYWRkaXRpb25hbERhdGEgPSBhZGRpdGlvbmFsRGF0YTtcbiAgICB9XG5cbiAgICBjb25zdCBvYnNlcnYgPSB0aGlzLmh0dHAucG9zdDxBcGlSZXNwb25zZT4oXG4gICAgICB0aGlzLmdldFNlcnZlclBhdGgoKSArIHRoaXMub3B0aW9ucy5zaWduSW5QYXRoLCBib2R5XG4gICAgKS5waXBlKHNoYXJlKCkpO1xuXG4gICAgb2JzZXJ2LnN1YnNjcmliZShyZXMgPT4gdGhpcy51c2VyRGF0YS5uZXh0KHJlcy5kYXRhKSk7XG5cbiAgICByZXR1cm4gb2JzZXJ2O1xuICB9XG5cbiAgc2lnbkluT0F1dGgob0F1dGhUeXBlOiBzdHJpbmcsIHJlZ2lzdHJhdGlvblRva2VuPzogc3RyaW5nLCBpbkFwcEJyb3dzZXI/OiBUb2tlbkluQXBwQnJvd3NlcjxhbnksIGFueT4sIHBsYXRmb3JtPzogVG9rZW5QbGF0Zm9ybSkge1xuXG4gICAgY29uc3Qgb0F1dGhQYXRoOiBzdHJpbmcgPSB0aGlzLmdldE9BdXRoUGF0aChvQXV0aFR5cGUpO1xuICAgIGNvbnN0IGNhbGxiYWNrVXJsID0gYCR7dGhpcy5nbG9iYWwubG9jYXRpb24ub3JpZ2lufS8ke3RoaXMub3B0aW9ucy5vQXV0aENhbGxiYWNrUGF0aH1gO1xuICAgIGNvbnN0IG9BdXRoV2luZG93VHlwZTogc3RyaW5nID0gdGhpcy5vcHRpb25zLm9BdXRoV2luZG93VHlwZTtcbiAgICBjb25zdCBhdXRoVXJsOiBzdHJpbmcgPSB0aGlzLmdldE9BdXRoVXJsKG9BdXRoUGF0aCwgY2FsbGJhY2tVcmwsIG9BdXRoV2luZG93VHlwZSwgcmVnaXN0cmF0aW9uVG9rZW4pO1xuXG4gICAgaWYgKG9BdXRoV2luZG93VHlwZSA9PT0gJ25ld1dpbmRvdycgfHxcbiAgICAgIChvQXV0aFdpbmRvd1R5cGUgPT0gJ2luQXBwQnJvd3NlcicgJiYgKCFwbGF0Zm9ybSB8fCAhcGxhdGZvcm0uaXMoJ2NvcmRvdmEnKSB8fCAhKHBsYXRmb3JtLmlzKCdpb3MnKSB8fCBwbGF0Zm9ybS5pcygnYW5kcm9pZCcpKSkpKSB7XG4gICAgICBjb25zdCBvQXV0aFdpbmRvd09wdGlvbnMgPSB0aGlzLm9wdGlvbnMub0F1dGhXaW5kb3dPcHRpb25zO1xuICAgICAgbGV0IHdpbmRvd09wdGlvbnMgPSAnJztcblxuICAgICAgaWYgKG9BdXRoV2luZG93T3B0aW9ucykge1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBvQXV0aFdpbmRvd09wdGlvbnMpIHtcbiAgICAgICAgICBpZiAob0F1dGhXaW5kb3dPcHRpb25zLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgd2luZG93T3B0aW9ucyArPSBgLCR7a2V5fT0ke29BdXRoV2luZG93T3B0aW9uc1trZXldfWA7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHBvcHVwID0gd2luZG93Lm9wZW4oXG4gICAgICAgICAgYXV0aFVybCxcbiAgICAgICAgICAnX2JsYW5rJyxcbiAgICAgICAgICBgY2xvc2VidXR0b25jYXB0aW9uPUNhbmNlbCR7d2luZG93T3B0aW9uc31gXG4gICAgICApO1xuICAgICAgcmV0dXJuIHRoaXMucmVxdWVzdENyZWRlbnRpYWxzVmlhUG9zdE1lc3NhZ2UocG9wdXApO1xuICAgIH0gZWxzZSBpZiAob0F1dGhXaW5kb3dUeXBlID09ICdpbkFwcEJyb3dzZXInKSB7XG4gICAgICBsZXQgb0F1dGhCcm93c2VyQ2FsbGJhY2sgPSB0aGlzLm9wdGlvbnMub0F1dGhCcm93c2VyQ2FsbGJhY2tzW29BdXRoVHlwZV07XG4gICAgICBpZiAoIW9BdXRoQnJvd3NlckNhbGxiYWNrKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVG8gbG9naW4gd2l0aCBvQXV0aCBwcm92aWRlciAke29BdXRoVHlwZX0gdXNpbmcgaW5BcHBCcm93c2VyIHRoZSBjYWxsYmFjayAoaW4gb0F1dGhCcm93c2VyQ2FsbGJhY2tzKSBpcyByZXF1aXJlZC5gKTtcbiAgICAgIH1cbiAgICAgIC8vIGxldCBvQXV0aFdpbmRvd09wdGlvbnMgPSB0aGlzLm9wdGlvbnMub0F1dGhXaW5kb3dPcHRpb25zO1xuICAgICAgLy8gbGV0IHdpbmRvd09wdGlvbnMgPSAnJztcblxuICAgICAgLy8gIGlmIChvQXV0aFdpbmRvd09wdGlvbnMpIHtcbiAgICAgIC8vICAgICBmb3IgKGxldCBrZXkgaW4gb0F1dGhXaW5kb3dPcHRpb25zKSB7XG4gICAgICAvLyAgICAgICAgIHdpbmRvd09wdGlvbnMgKz0gYCwke2tleX09JHtvQXV0aFdpbmRvd09wdGlvbnNba2V5XX1gO1xuICAgICAgLy8gICAgIH1cbiAgICAgIC8vIH1cblxuICAgICAgbGV0IGJyb3dzZXIgPSBpbkFwcEJyb3dzZXIuY3JlYXRlKFxuICAgICAgICAgIGF1dGhVcmwsXG4gICAgICAgICAgJ19ibGFuaycsXG4gICAgICAgICAgJ2xvY2F0aW9uPW5vJ1xuICAgICAgKTtcblxuICAgICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlKChvYnNlcnZlcikgPT4ge1xuICAgICAgICBicm93c2VyLm9uKCdsb2Fkc3RvcCcpLnN1YnNjcmliZSgoZXY6IGFueSkgPT4ge1xuICAgICAgICAgIGlmIChldi51cmwuaW5kZXhPZihvQXV0aEJyb3dzZXJDYWxsYmFjaykgPiAtMSkge1xuICAgICAgICAgICAgYnJvd3Nlci5leGVjdXRlU2NyaXB0KHtjb2RlOiBcInJlcXVlc3RDcmVkZW50aWFscygpO1wifSkudGhlbigoY3JlZGVudGlhbHM6IGFueSkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLmdldEF1dGhEYXRhRnJvbVBvc3RNZXNzYWdlKGNyZWRlbnRpYWxzWzBdKTtcblxuICAgICAgICAgICAgICBsZXQgcG9sbGVyT2JzZXJ2ID0gaW50ZXJ2YWwoNDAwKTtcblxuICAgICAgICAgICAgICBsZXQgcG9sbGVyU3Vic2NyaXB0aW9uID0gcG9sbGVyT2JzZXJ2LnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudXNlclNpZ25lZEluKCkpIHtcbiAgICAgICAgICAgICAgICAgIG9ic2VydmVyLm5leHQodGhpcy5hdXRoRGF0YSk7XG4gICAgICAgICAgICAgICAgICBvYnNlcnZlci5jb21wbGV0ZSgpO1xuXG4gICAgICAgICAgICAgICAgICBwb2xsZXJTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgICAgIGJyb3dzZXIuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sIChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgb2JzZXJ2ZXIuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgIG9ic2VydmVyLmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCAoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICAgICAgICBvYnNlcnZlci5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgIG9ic2VydmVyLmNvbXBsZXRlKCk7XG4gICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICBvYnNlcnZlci5lcnJvcihlcnJvcik7XG4gICAgICAgICAgb2JzZXJ2ZXIuY29tcGxldGUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KVxuICAgIH0gZWxzZSBpZiAob0F1dGhXaW5kb3dUeXBlID09PSAnc2FtZVdpbmRvdycpIHtcbiAgICAgIHRoaXMuZ2xvYmFsLmxvY2F0aW9uLmhyZWYgPSBhdXRoVXJsO1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBvQXV0aFdpbmRvd1R5cGUgXCIke29BdXRoV2luZG93VHlwZX1cImApO1xuICAgIH1cbiAgfVxuXG4gIHByb2Nlc3NPQXV0aENhbGxiYWNrKCk6IHZvaWQge1xuICAgIHRoaXMuZ2V0QXV0aERhdGFGcm9tUGFyYW1zKCk7XG4gIH1cblxuICAvLyBTaWduIG91dCByZXF1ZXN0IGFuZCBkZWxldGUgc3RvcmFnZVxuICBzaWduT3V0KCk6IE9ic2VydmFibGU8QXBpUmVzcG9uc2U+IHtcbiAgICByZXR1cm4gdGhpcy5odHRwLmRlbGV0ZTxBcGlSZXNwb25zZT4odGhpcy5nZXRTZXJ2ZXJQYXRoKCkgKyB0aGlzLm9wdGlvbnMuc2lnbk91dFBhdGgpXG4gICAgICAvLyBPbmx5IHJlbW92ZSB0aGUgbG9jYWxTdG9yYWdlIGFuZCBjbGVhciB0aGUgZGF0YSBhZnRlciB0aGUgY2FsbFxuICAgICAgLnBpcGUoXG4gICAgICAgIGZpbmFsaXplKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2FjY2Vzc1Rva2VuJyk7XG4gICAgICAgICAgICB0aGlzLmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdjbGllbnQnKTtcbiAgICAgICAgICAgIHRoaXMubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2V4cGlyeScpO1xuICAgICAgICAgICAgdGhpcy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndG9rZW5UeXBlJyk7XG4gICAgICAgICAgICB0aGlzLmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd1aWQnKTtcblxuICAgICAgICAgICAgdGhpcy5hdXRoRGF0YS5uZXh0KG51bGwpO1xuICAgICAgICAgICAgdGhpcy51c2VyVHlwZS5uZXh0KG51bGwpO1xuICAgICAgICAgICAgdGhpcy51c2VyRGF0YS5uZXh0KG51bGwpO1xuICAgICAgICAgIH1cbiAgICAgICAgKVxuICAgICAgKTtcbiAgfVxuXG4gIC8vIFZhbGlkYXRlIHRva2VuIHJlcXVlc3RcbiAgdmFsaWRhdGVUb2tlbigpOiBPYnNlcnZhYmxlPEFwaVJlc3BvbnNlPiB7XG4gICAgY29uc3Qgb2JzZXJ2ID0gdGhpcy5odHRwLmdldDxBcGlSZXNwb25zZT4oXG4gICAgICB0aGlzLmdldFNlcnZlclBhdGgoKSArIHRoaXMub3B0aW9ucy52YWxpZGF0ZVRva2VuUGF0aFxuICAgICkucGlwZShzaGFyZSgpKTtcblxuICAgIG9ic2Vydi5zdWJzY3JpYmUoXG4gICAgICAocmVzKSA9PiB0aGlzLnVzZXJEYXRhLm5leHQocmVzLmRhdGEpLFxuICAgICAgKGVycm9yKSA9PiB7XG4gICAgICAgIGlmIChlcnJvci5zdGF0dXMgPT09IDQwMSAmJiB0aGlzLm9wdGlvbnMuc2lnbk91dEZhaWxlZFZhbGlkYXRlKSB7XG4gICAgICAgICAgdGhpcy5zaWduT3V0KCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBvYnNlcnY7XG4gIH1cblxuICAvLyBVcGRhdGUgcGFzc3dvcmQgcmVxdWVzdFxuICB1cGRhdGVQYXNzd29yZCh1cGRhdGVQYXNzd29yZERhdGE6IFVwZGF0ZVBhc3N3b3JkRGF0YSk6IE9ic2VydmFibGU8QXBpUmVzcG9uc2U+IHtcblxuICAgIGlmICh1cGRhdGVQYXNzd29yZERhdGEudXNlclR5cGUgIT0gbnVsbCkge1xuICAgICAgdGhpcy51c2VyVHlwZS5uZXh0KHRoaXMuZ2V0VXNlclR5cGVCeU5hbWUodXBkYXRlUGFzc3dvcmREYXRhLnVzZXJUeXBlKSk7XG4gICAgfVxuXG4gICAgbGV0IGFyZ3M6IGFueTtcblxuICAgIGlmICh1cGRhdGVQYXNzd29yZERhdGEucGFzc3dvcmRDdXJyZW50ID09IG51bGwpIHtcbiAgICAgIGFyZ3MgPSB7XG4gICAgICAgIHBhc3N3b3JkOiAgICAgICAgICAgICAgIHVwZGF0ZVBhc3N3b3JkRGF0YS5wYXNzd29yZCxcbiAgICAgICAgcGFzc3dvcmRfY29uZmlybWF0aW9uOiAgdXBkYXRlUGFzc3dvcmREYXRhLnBhc3N3b3JkQ29uZmlybWF0aW9uXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBhcmdzID0ge1xuICAgICAgICBjdXJyZW50X3Bhc3N3b3JkOiAgICAgICB1cGRhdGVQYXNzd29yZERhdGEucGFzc3dvcmRDdXJyZW50LFxuICAgICAgICBwYXNzd29yZDogICAgICAgICAgICAgICB1cGRhdGVQYXNzd29yZERhdGEucGFzc3dvcmQsXG4gICAgICAgIHBhc3N3b3JkX2NvbmZpcm1hdGlvbjogIHVwZGF0ZVBhc3N3b3JkRGF0YS5wYXNzd29yZENvbmZpcm1hdGlvblxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAodXBkYXRlUGFzc3dvcmREYXRhLnJlc2V0UGFzc3dvcmRUb2tlbikge1xuICAgICAgYXJncy5yZXNldF9wYXNzd29yZF90b2tlbiA9IHVwZGF0ZVBhc3N3b3JkRGF0YS5yZXNldFBhc3N3b3JkVG9rZW47XG4gICAgfVxuXG4gICAgY29uc3QgYm9keSA9IGFyZ3M7XG4gICAgcmV0dXJuIHRoaXMuaHR0cC5wdXQ8QXBpUmVzcG9uc2U+KHRoaXMuZ2V0U2VydmVyUGF0aCgpICsgdGhpcy5vcHRpb25zLnVwZGF0ZVBhc3N3b3JkUGF0aCwgYm9keSk7XG4gIH1cblxuICAvLyBSZXNldCBwYXNzd29yZCByZXF1ZXN0XG4gIHJlc2V0UGFzc3dvcmQocmVzZXRQYXNzd29yZERhdGE6IFJlc2V0UGFzc3dvcmREYXRhKTogT2JzZXJ2YWJsZTxBcGlSZXNwb25zZT4ge1xuXG4gICAgdGhpcy51c2VyVHlwZS5uZXh0KFxuICAgICAgKHJlc2V0UGFzc3dvcmREYXRhLnVzZXJUeXBlID09IG51bGwpID8gbnVsbCA6IHRoaXMuZ2V0VXNlclR5cGVCeU5hbWUocmVzZXRQYXNzd29yZERhdGEudXNlclR5cGUpXG4gICAgKTtcblxuICAgIGNvbnN0IGJvZHkgPSB7XG4gICAgICBbdGhpcy5vcHRpb25zLmxvZ2luRmllbGRdOiByZXNldFBhc3N3b3JkRGF0YS5sb2dpbixcbiAgICAgIHJlZGlyZWN0X3VybDogdGhpcy5vcHRpb25zLnJlc2V0UGFzc3dvcmRDYWxsYmFja1xuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy5odHRwLnBvc3Q8QXBpUmVzcG9uc2U+KHRoaXMuZ2V0U2VydmVyUGF0aCgpICsgdGhpcy5vcHRpb25zLnJlc2V0UGFzc3dvcmRQYXRoLCBib2R5KTtcbiAgfVxuXG5cbiAgLyoqXG4gICAqXG4gICAqIENvbnN0cnVjdCBQYXRocyAvIFVybHNcbiAgICpcbiAgICovXG5cbiAgcHJpdmF0ZSBnZXRVc2VyUGF0aCgpOiBzdHJpbmcge1xuICAgIHJldHVybiAodGhpcy51c2VyVHlwZS52YWx1ZSA9PSBudWxsKSA/ICcnIDogdGhpcy51c2VyVHlwZS52YWx1ZS5wYXRoICsgJy8nO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRBcGlQYXRoKCk6IHN0cmluZyB7XG4gICAgbGV0IGNvbnN0cnVjdGVkUGF0aCA9ICcnO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5hcGlCYXNlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0cnVjdGVkUGF0aCArPSB0aGlzLm9wdGlvbnMuYXBpQmFzZSArICcvJztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmFwaVBhdGggIT0gbnVsbCkge1xuICAgICAgY29uc3RydWN0ZWRQYXRoICs9IHRoaXMub3B0aW9ucy5hcGlQYXRoICsgJy8nO1xuICAgIH1cblxuICAgIHJldHVybiBjb25zdHJ1Y3RlZFBhdGg7XG4gIH1cblxuICBwcml2YXRlIGdldFNlcnZlclBhdGgoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5nZXRBcGlQYXRoKCkgKyB0aGlzLmdldFVzZXJQYXRoKCk7XG4gIH1cblxuICBwcml2YXRlIGdldE9BdXRoUGF0aChvQXV0aFR5cGU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgbGV0IG9BdXRoUGF0aDogc3RyaW5nO1xuXG4gICAgb0F1dGhQYXRoID0gdGhpcy5vcHRpb25zLm9BdXRoUGF0aHNbb0F1dGhUeXBlXTtcblxuICAgIGlmIChvQXV0aFBhdGggPT0gbnVsbCkge1xuICAgICAgb0F1dGhQYXRoID0gYC9hdXRoLyR7b0F1dGhUeXBlfWA7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9BdXRoUGF0aDtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0T0F1dGhVcmwob0F1dGhQYXRoOiBzdHJpbmcsIGNhbGxiYWNrVXJsOiBzdHJpbmcsIHdpbmRvd1R5cGU6IHN0cmluZywgcmVnaXN0cmF0aW9uVG9rZW4/OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGxldCB1cmw6IHN0cmluZztcblxuICAgIHVybCA9ICAgYCR7dGhpcy5vcHRpb25zLm9BdXRoQmFzZX0vJHtvQXV0aFBhdGh9YDtcbiAgICB1cmwgKz0gIGA/b21uaWF1dGhfd2luZG93X3R5cGU9JHt3aW5kb3dUeXBlfWA7XG4gICAgdXJsICs9ICBgJmF1dGhfb3JpZ2luX3VybD0ke2VuY29kZVVSSUNvbXBvbmVudChjYWxsYmFja1VybCl9YDtcblxuICAgIGlmIChyZWdpc3RyYXRpb25Ub2tlbikge1xuICAgICAgdXJsICs9IGAmcmVnaXN0cmF0aW9uX3Rva2VuPSR7cmVnaXN0cmF0aW9uVG9rZW59YDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy51c2VyVHlwZS52YWx1ZSAhPSBudWxsKSB7XG4gICAgICB1cmwgKz0gYCZyZXNvdXJjZV9jbGFzcz0ke3RoaXMudXNlclR5cGUudmFsdWUubmFtZX1gO1xuICAgIH1cblxuICAgIHJldHVybiB1cmw7XG4gIH1cblxuXG4gIC8qKlxuICAgKlxuICAgKiBHZXQgQXV0aCBEYXRhXG4gICAqXG4gICAqL1xuXG4gIC8vIFRyeSB0byBsb2FkIGF1dGggZGF0YVxuICBwcml2YXRlIHRyeUxvYWRBdXRoRGF0YSgpOiB2b2lkIHtcblxuICAgIGNvbnN0IHVzZXJUeXBlID0gdGhpcy5nZXRVc2VyVHlwZUJ5TmFtZSh0aGlzLmxvY2FsU3RvcmFnZS5nZXRJdGVtKCd1c2VyVHlwZScpKTtcblxuICAgIGlmICh1c2VyVHlwZSkge1xuICAgICAgdGhpcy51c2VyVHlwZS5uZXh0KHVzZXJUeXBlKTtcbiAgICB9XG5cbiAgICB0aGlzLmdldEF1dGhEYXRhRnJvbVN0b3JhZ2UoKTtcblxuICAgIGlmICh0aGlzLmFjdGl2YXRlZFJvdXRlKSB7XG4gICAgICB0aGlzLmdldEF1dGhEYXRhRnJvbVBhcmFtcygpO1xuICAgIH1cblxuICAgIC8vIGlmICh0aGlzLmF1dGhEYXRhKSB7XG4gICAgLy8gICAgIHRoaXMudmFsaWRhdGVUb2tlbigpO1xuICAgIC8vIH1cbiAgfVxuXG4gIC8vIFBhcnNlIEF1dGggZGF0YSBmcm9tIHJlc3BvbnNlXG4gIHB1YmxpYyBnZXRBdXRoSGVhZGVyc0Zyb21SZXNwb25zZShkYXRhOiBIdHRwUmVzcG9uc2U8YW55PiB8IEh0dHBFcnJvclJlc3BvbnNlKTogdm9pZCB7XG4gICAgY29uc3QgaGVhZGVycyA9IGRhdGEuaGVhZGVycztcblxuICAgIGNvbnN0IGF1dGhEYXRhOiBBdXRoRGF0YSA9IHtcbiAgICAgIGFjY2Vzc1Rva2VuOiAgICBoZWFkZXJzLmdldCgnYWNjZXNzLXRva2VuJyksXG4gICAgICBjbGllbnQ6ICAgICAgICAgaGVhZGVycy5nZXQoJ2NsaWVudCcpLFxuICAgICAgZXhwaXJ5OiAgICAgICAgIGhlYWRlcnMuZ2V0KCdleHBpcnknKSxcbiAgICAgIHRva2VuVHlwZTogICAgICBoZWFkZXJzLmdldCgndG9rZW4tdHlwZScpLFxuICAgICAgdWlkOiAgICAgICAgICAgIGhlYWRlcnMuZ2V0KCd1aWQnKVxuICAgIH07XG5cbiAgICB0aGlzLnNldEF1dGhEYXRhKGF1dGhEYXRhKTtcbiAgfVxuXG4gIC8vIFBhcnNlIEF1dGggZGF0YSBmcm9tIHBvc3QgbWVzc2FnZVxuICBwcml2YXRlIGdldEF1dGhEYXRhRnJvbVBvc3RNZXNzYWdlKGRhdGE6IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IGF1dGhEYXRhOiBBdXRoRGF0YSA9IHtcbiAgICAgIGFjY2Vzc1Rva2VuOiAgICBkYXRhWydhdXRoX3Rva2VuJ10sXG4gICAgICBjbGllbnQ6ICAgICAgICAgZGF0YVsnY2xpZW50X2lkJ10sXG4gICAgICBleHBpcnk6ICAgICAgICAgZGF0YVsnZXhwaXJ5J10sXG4gICAgICB0b2tlblR5cGU6ICAgICAgJ0JlYXJlcicsXG4gICAgICB1aWQ6ICAgICAgICAgICAgZGF0YVsndWlkJ11cbiAgICB9O1xuXG4gICAgdGhpcy5zZXRBdXRoRGF0YShhdXRoRGF0YSk7XG4gIH1cblxuICAvLyBUcnkgdG8gZ2V0IGF1dGggZGF0YSBmcm9tIHN0b3JhZ2UuXG4gIHB1YmxpYyBnZXRBdXRoRGF0YUZyb21TdG9yYWdlKCk6IHZvaWQge1xuXG4gICAgY29uc3QgYXV0aERhdGE6IEF1dGhEYXRhID0ge1xuICAgICAgYWNjZXNzVG9rZW46ICAgIHRoaXMubG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FjY2Vzc1Rva2VuJyksXG4gICAgICBjbGllbnQ6ICAgICAgICAgdGhpcy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnY2xpZW50JyksXG4gICAgICBleHBpcnk6ICAgICAgICAgdGhpcy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnZXhwaXJ5JyksXG4gICAgICB0b2tlblR5cGU6ICAgICAgdGhpcy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndG9rZW5UeXBlJyksXG4gICAgICB1aWQ6ICAgICAgICAgICAgdGhpcy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndWlkJylcbiAgICB9O1xuXG4gICAgaWYgKHRoaXMuY2hlY2tBdXRoRGF0YShhdXRoRGF0YSkpIHtcbiAgICAgIHRoaXMuYXV0aERhdGEubmV4dChhdXRoRGF0YSk7XG4gICAgfVxuICB9XG5cbiAgLy8gVHJ5IHRvIGdldCBhdXRoIGRhdGEgZnJvbSB1cmwgcGFyYW1ldGVycy5cbiAgcHJpdmF0ZSBnZXRBdXRoRGF0YUZyb21QYXJhbXMoKTogdm9pZCB7XG4gICAgdGhpcy5hY3RpdmF0ZWRSb3V0ZS5xdWVyeVBhcmFtcy5zdWJzY3JpYmUocXVlcnlQYXJhbXMgPT4ge1xuICAgICAgY29uc3QgYXV0aERhdGE6IEF1dGhEYXRhID0ge1xuICAgICAgICBhY2Nlc3NUb2tlbjogICAgcXVlcnlQYXJhbXNbJ3Rva2VuJ10gfHwgcXVlcnlQYXJhbXNbJ2F1dGhfdG9rZW4nXSxcbiAgICAgICAgY2xpZW50OiAgICAgICAgIHF1ZXJ5UGFyYW1zWydjbGllbnRfaWQnXSxcbiAgICAgICAgZXhwaXJ5OiAgICAgICAgIHF1ZXJ5UGFyYW1zWydleHBpcnknXSxcbiAgICAgICAgdG9rZW5UeXBlOiAgICAgICdCZWFyZXInLFxuICAgICAgICB1aWQ6ICAgICAgICAgICAgcXVlcnlQYXJhbXNbJ3VpZCddXG4gICAgICB9O1xuXG4gICAgICBpZiAodGhpcy5jaGVja0F1dGhEYXRhKGF1dGhEYXRhKSkge1xuICAgICAgICB0aGlzLmF1dGhEYXRhLm5leHQoYXV0aERhdGEpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqIFNldCBBdXRoIERhdGFcbiAgICpcbiAgICovXG5cbiAgLy8gV3JpdGUgYXV0aCBkYXRhIHRvIHN0b3JhZ2VcbiAgcHJpdmF0ZSBzZXRBdXRoRGF0YShhdXRoRGF0YTogQXV0aERhdGEpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5jaGVja0F1dGhEYXRhKGF1dGhEYXRhKSkge1xuXG4gICAgICB0aGlzLmF1dGhEYXRhLm5leHQoYXV0aERhdGEpO1xuXG4gICAgICB0aGlzLmxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhY2Nlc3NUb2tlbicsIGF1dGhEYXRhLmFjY2Vzc1Rva2VuKTtcbiAgICAgIHRoaXMubG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2NsaWVudCcsIGF1dGhEYXRhLmNsaWVudCk7XG4gICAgICB0aGlzLmxvY2FsU3RvcmFnZS5zZXRJdGVtKCdleHBpcnknLCBhdXRoRGF0YS5leHBpcnkpO1xuICAgICAgdGhpcy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndG9rZW5UeXBlJywgYXV0aERhdGEudG9rZW5UeXBlKTtcbiAgICAgIHRoaXMubG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3VpZCcsIGF1dGhEYXRhLnVpZCk7XG5cbiAgICAgIGlmICh0aGlzLnVzZXJUeXBlLnZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndXNlclR5cGUnLCB0aGlzLnVzZXJUeXBlLnZhbHVlLm5hbWUpO1xuICAgICAgfVxuXG4gICAgfVxuICB9XG5cblxuICAvKipcbiAgICpcbiAgICogVmFsaWRhdGUgQXV0aCBEYXRhXG4gICAqXG4gICAqL1xuXG4gIC8vIENoZWNrIGlmIGF1dGggZGF0YSBjb21wbGV0ZSBhbmQgaWYgcmVzcG9uc2UgdG9rZW4gaXMgbmV3ZXJcbiAgcHJpdmF0ZSBjaGVja0F1dGhEYXRhKGF1dGhEYXRhOiBBdXRoRGF0YSk6IGJvb2xlYW4ge1xuXG4gICAgaWYgKFxuICAgICAgYXV0aERhdGEuYWNjZXNzVG9rZW4gIT0gbnVsbCAmJlxuICAgICAgYXV0aERhdGEuY2xpZW50ICE9IG51bGwgJiZcbiAgICAgIGF1dGhEYXRhLmV4cGlyeSAhPSBudWxsICYmXG4gICAgICBhdXRoRGF0YS50b2tlblR5cGUgIT0gbnVsbCAmJlxuICAgICAgYXV0aERhdGEudWlkICE9IG51bGxcbiAgICApIHtcbiAgICAgIGlmICh0aGlzLmF1dGhEYXRhLnZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGF1dGhEYXRhLmV4cGlyeSA+PSB0aGlzLmF1dGhEYXRhLnZhbHVlLmV4cGlyeTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuXG4gIC8qKlxuICAgKlxuICAgKiBPQXV0aFxuICAgKlxuICAgKi9cblxuICBwcml2YXRlIHJlcXVlc3RDcmVkZW50aWFsc1ZpYVBvc3RNZXNzYWdlKGF1dGhXaW5kb3c6IGFueSk6IE9ic2VydmFibGU8YW55PiB7XG4gICAgY29uc3QgcG9sbGVyT2JzZXJ2ID0gaW50ZXJ2YWwoNTAwKTtcblxuICAgIGNvbnN0IHJlc3BvbnNlT2JzZXJ2ID0gZnJvbUV2ZW50KHRoaXMuZ2xvYmFsLCAnbWVzc2FnZScpLnBpcGUoXG4gICAgICBwbHVjaygnZGF0YScpLFxuICAgICAgZmlsdGVyKHRoaXMub0F1dGhXaW5kb3dSZXNwb25zZUZpbHRlcilcbiAgICApO1xuXG4gICAgcmVzcG9uc2VPYnNlcnYuc3Vic2NyaWJlKFxuICAgICAgdGhpcy5nZXRBdXRoRGF0YUZyb21Qb3N0TWVzc2FnZS5iaW5kKHRoaXMpXG4gICAgKTtcblxuICAgIGNvbnN0IHBvbGxlclN1YnNjcmlwdGlvbiA9IHBvbGxlck9ic2Vydi5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgaWYgKGF1dGhXaW5kb3cuY2xvc2VkKSB7XG4gICAgICAgIHBvbGxlclN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXV0aFdpbmRvdy5wb3N0TWVzc2FnZSgncmVxdWVzdENyZWRlbnRpYWxzJywgJyonKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXNwb25zZU9ic2VydjtcbiAgfVxuXG4gIHByaXZhdGUgb0F1dGhXaW5kb3dSZXNwb25zZUZpbHRlcihkYXRhOiBhbnkpOiBhbnkge1xuICAgIGlmIChkYXRhLm1lc3NhZ2UgPT09ICdkZWxpdmVyQ3JlZGVudGlhbHMnIHx8IGRhdGEubWVzc2FnZSA9PT0gJ2F1dGhGYWlsdXJlJykge1xuICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfVxuICB9XG5cblxuICAvKipcbiAgICpcbiAgICogVXRpbGl0aWVzXG4gICAqXG4gICAqL1xuXG4gIC8vIE1hdGNoIHVzZXIgY29uZmlnIGJ5IHVzZXIgY29uZmlnIG5hbWVcbiAgcHJpdmF0ZSBnZXRVc2VyVHlwZUJ5TmFtZShuYW1lOiBzdHJpbmcpOiBVc2VyVHlwZSB7XG4gICAgaWYgKG5hbWUgPT0gbnVsbCB8fCB0aGlzLm9wdGlvbnMudXNlclR5cGVzID09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMudXNlclR5cGVzLmZpbmQoXG4gICAgICB1c2VyVHlwZSA9PiB1c2VyVHlwZS5uYW1lID09PSBuYW1lXG4gICAgKTtcbiAgfVxufVxuIl19