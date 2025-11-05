import { type JSX } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { Header } from './components/layout';
import { EventSearch } from './components/search';
import { Favorites } from './components/favorites';
import { EventDetail } from './components/detail';

function App(): JSX.Element {
	return (
		<BrowserRouter>
			<div className="App">
				<Header />
				<Routes>
					<Route path="/search" element={<EventSearch />} />
					<Route path="/favorites" element={<Favorites />} />
					<Route path="/event/:id" element={<EventDetail />} />
					<Route path="/" element={<Navigate to="/search" replace />} />
				</Routes>
			</div>
		</BrowserRouter>
	);
}

export default App;
