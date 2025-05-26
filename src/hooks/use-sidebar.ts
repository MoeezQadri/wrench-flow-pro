
import { useState } from 'react';

export const useSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return {
    collapsed,
    setCollapsed,
  };
};
