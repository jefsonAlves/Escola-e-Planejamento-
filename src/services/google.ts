export const getGoogleToken = () => {
  return localStorage.getItem('google_access_token');
};

const gFetch = async (url: string, options: RequestInit = {}) => {
  const token = getGoogleToken();
  if (!token) {
    throw new Error('Faça login novamente com Google para permitir a sincronização com Agenda e Classroom.');
  }

  const headers = new Headers(options.headers);
  headers.append('Authorization', `Bearer ${token}`);
  
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Faça login novamente com Google para permitir a sincronização com Agenda e Classroom.');
    }
    throw new Error(`Google API error: ${response.statusText}`);
  }
  
  return response.json();
};

export const fetchClassroomCourses = async () => {
  const data = await gFetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE');
  return data.courses || [];
};

export const fetchClassroomStudents = async (courseId: string) => {
  const data = await gFetch(`https://classroom.googleapis.com/v1/courses/${courseId}/students`);
  return data.students || [];
};

export const fetchClassroomCourseWork = async (courseId: string) => {
  const data = await gFetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`);
  return data.courseWork || [];
};

export const fetchCalendarEvents = async () => {
  const timeMin = new Date().toISOString();
  const data = await gFetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=50&orderBy=startTime&singleEvents=true`);
  return data.items || [];
};

export const fetchTasks = async (taskListId: string = '@default') => {
  const data = await gFetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`);
  return data.items || [];
};
