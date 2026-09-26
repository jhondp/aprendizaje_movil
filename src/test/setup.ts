import '@testing-library/jest-dom/vitest';

// jsdom does not implement scrolling; stub it so pages can reset the scroll position.
window.scrollTo = () => {};
