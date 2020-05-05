import { h } from 'preact';
import { Link } from 'preact-router/match';
import style from './style.css';

import { css } from 'linaria';
import { styled } from 'linaria/react';

const header = css`
    color: aliceblue;
    font-weight: 800;
    display: inline-block;
    margin-right: 10px;
`;

const WithLinaria = styled.h1`
    color: ${props => props.color};
    display: inline-block;
`

const Header = () => (
	<header class={style.header}>
		<h1 class={header}>Preact App</h1>
        <WithLinaria color="aliceblue">
            with Linaria!
        </WithLinaria>
		<nav>
			<Link activeClassName={style.active} href="/">Home</Link>
			<Link activeClassName={style.active} href="/profile">Me</Link>
			<Link activeClassName={style.active} href="/profile/john">John</Link>
		</nav>
	</header>
);

export default Header;
