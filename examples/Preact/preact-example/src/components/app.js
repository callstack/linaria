import { h, Component } from 'preact';
import { Router } from 'preact-router';

import Header from './header';

import { css } from 'linaria';
import { styled } from 'linaria/react';

// Code-splitting is automated for routes
import Home from '../routes/home';
import Profile from '../routes/profile';

const Background = styled.div`
    background-color: aliceblue;
`; 

const bluishText = css`
    color: cornflowerblue;
`

export default class App extends Component {
	
	/** Gets fired when the route changes.
	 *	@param {Object} event		"change" event from [preact-router](http://git.io/preact-router)
	 *	@param {string} event.url	The newly routed URL
	 */
	handleRoute = e => {
		this.currentUrl = e.url;
	};

	render() {
		return (
			<Background class={bluishText} id="app">
				<Header />
				<Router onChange={this.handleRoute}>
					<Home path="/" />
					<Profile path="/profile/" user="me" />
					<Profile path="/profile/:user" />
				</Router>
			</Background>
		);
	}
}
