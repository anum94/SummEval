import { createContext, useEffect, useState } from 'react';
import axios, { endpoints } from './utils/axios.js';

export const ProjectsContext = createContext();

const THIRTY_MINUTE_CACHE_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

// Create a provider component
export function ProjectsProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Triggers a refresh

  const fetchProjects = () => {
    console.log("Fetching projects...");
    setLoading(true); 
    axios
      .get(endpoints.projects)
      .then((response) => {
        if (response.status === 200) {
          const fetchedProjects = response.data;
          setProjects(fetchedProjects);
          setLoading(false);
  
          // Update the cache with the fetched projects
          localStorage.setItem(
            'projects',
            JSON.stringify({
              timestamp: new Date(),
              projects: fetchedProjects,
            })
          );
  
          console.log("Projects fetched and state updated.");
        } else {
          console.error("Failed to fetch projects: Non-200 status code", response.status);
        }
      })
      .catch((error) => {
        console.error("Error fetching projects:", error);
        setLoading(false);
      });
  };

  // Fetch data on component mount or when refreshTrigger changes
  useEffect(() => {
    const cached_projects = localStorage.getItem(`projects`);
    if (
      cached_projects &&
      new Date() - new Date(JSON.parse(cached_projects).timestamp) <= THIRTY_MINUTE_CACHE_TIMEOUT
    ) {
      // Use cached data if valid
      console.log("First in the cached projects part");
      const parsed_projects = JSON.parse(cached_projects);
      setProjects(parsed_projects.projects);
      setLoading(false);
    } else {
      // Fetch fresh data if cache is missing/invalid
      fetchProjects();
    }
  }, [refreshTrigger]); // Fetch projects when refreshTrigger changes

  // Trigger refresh
  const refreshProjects = () => {
    setRefreshTrigger((prev) => prev + 1)};

  return (
    <ProjectsContext.Provider value={{ projects, setProjects, loading, refreshProjects, fetchProjects}}>
      {children}
    </ProjectsContext.Provider>
  );
}
