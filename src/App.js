//#dependencies
import { Link, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

//#components
import Navigation from './components/Navigation';
import HeaderBar from './components/HeaderBar';
import Login from './views/Login-Register.view';

/* import checkLoginStatus from './utils/UseVerifyLogin'; */
//#utilities
import { API_BASEURL } from './utils/constants';
import parseFromStorage from './utils/parseFromLocalStorage';

const Container = styled.div`
	color: rgba(0, 0, 0, 0.8);
	height: 100vh;
`;
/*	background: rgb(76, 76, 84);
	background: linear-gradient(
		90deg,
		rgba(76, 76, 84, 1) 0%,
		rgba(126, 126, 126, 1) 22%,
		rgba(255, 255, 255, 1) 100%
	);*/

const BodyWrapper = styled.div`
	display: flex;
	flex-direction: ${({ navHidden }) => (navHidden ? 'column' : 'row')};
	box-sizing: border-box;
	height: 95%;
	width: 100%;
`;

const App = () => {
	const navHidden = false;

	const linksArr = [
		{ to: '/myprofile', name: 'My Profile' },
		{ to: '/', name: 'Logout' },
	];

	const [isLoggedIn, setIsLoggedIn] = useState(parseFromStorage('isLoggedIn'));

	const [currentUser, setCurrentUser] = useState(null);

	//! used to simulate login status for front-end development
	const fauxLogin = true;

	useEffect(() => {
		/* 	if (localStorage.getItem('isLoggedIn') === null) {
			console.log('re-check executes');
			checkLoginStatus().then((res) => {
				console.log(res);

				if (res) {
					localStorage.setItem('isLoggedIn', res);
					setIsLoggedIn(res);
				}
			});
		} */

		const checkLoginStatus = async () => {
			const response = await fetch(`${API_BASEURL}/user/myinfo`);
			console.log('getinfo response is ' + response.ok);
			if (response.ok) {
				const data = await response.json();
				localStorage.setItem('isLoggedIn', response.ok);
				console.log('data is ', data);
				console.log(
					'user is logged in: ' + localStorage.getItem('isLoggedIn')
				);
				setCurrentUser(data);
			} else {
				console.log('failed to get info');
				console.log('user is logged in: ' + false);
				localStorage.removeItem('isLoggedIn');
				setCurrentUser(null);
			}
		};

		checkLoginStatus();
	}, []);

	const handleLogout = async () => {
		console.log('logout executed');
		await fetch(`${API_BASEURL}/user/logout`);
		localStorage.removeItem('isLoggedIn');
		setCurrentUser(null);
	};

	return (
		<>
			{!parseFromStorage('isLoggedIn') ? (
				<Login
					handleLogin={(val) => {
						setCurrentUser(val);
					}}
				/>
			) : (
				<Container navHidden={navHidden}>
					<div style={{ height: '5%', zIndex: '2' }}>
						<HeaderBar
							handleLogout={handleLogout}
							headerLinksArr={linksArr}
							currentUser={
								currentUser
									? currentUser
									: { firstname: 'Hello', lastname: 'Guest' }
							}
						></HeaderBar>
					</div>
					<BodyWrapper>
						{navHidden ? '' : <Navigation widthSize="10%"></Navigation>}
						<div
							style={{
								boxSizing: 'border-box',
								width: navHidden ? '100%' : '87%',
								padding: '30px',
								background: '#fff',
								height: '100%',
							}}
						>
							<h1>This is App. test</h1>
							<div>
								{' '}
								<Link style={{ marginRight: '10px' }} to="/Login">
									login
								</Link>
								<Link style={{ marginRight: '10px' }} to="/User">
									user
								</Link>
							</div>

							<h3>App renders here</h3>
							<Outlet />
						</div>
					</BodyWrapper>
				</Container>
			)}
		</>
	);
};

export default App;
