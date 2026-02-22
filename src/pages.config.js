import Contacts from './pages/Contacts';
import Conversations from './pages/Conversations';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Pipeline from './pages/Pipeline';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Team from './pages/Team';
import Templates from './pages/Templates';
import AiAgents from './pages/AiAgents';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Contacts": Contacts,
    "Conversations": Conversations,
    "Dashboard": Dashboard,
    "Home": Home,
    "Pipeline": Pipeline,
    "Profile": Profile,
    "Settings": Settings,
    "Team": Team,
    "Templates": Templates,
    "AiAgents": AiAgents,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};