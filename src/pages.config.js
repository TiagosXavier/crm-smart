import { lazy } from 'react';
import __Layout from './Layout.jsx';

const Contacts = lazy(() => import('./pages/Contacts'));
const Conversations = lazy(() => import('./pages/Conversations'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Home = lazy(() => import('./pages/Home'));
const Pipeline = lazy(() => import('./pages/Pipeline'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Team = lazy(() => import('./pages/Team'));
const Templates = lazy(() => import('./pages/Templates'));
const AiAgents = lazy(() => import('./pages/AiAgents'));

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