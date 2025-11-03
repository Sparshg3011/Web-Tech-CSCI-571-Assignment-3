import { useState, type JSX } from 'react';
import './App.css';
import { Header } from './components/layout';
import { EventSearch } from './components/search';
import { Favorites } from './components/favorites';

function App(): JSX.Element {
  const [activeTab, setActiveTab] = useState<'search' | 'favorites'>('search');

  return (
    <div className="App">
      <Header onTabChange={setActiveTab} />
      {activeTab === 'search' ? <EventSearch /> : <Favorites />}
      </div>
  );
}

export default App;
