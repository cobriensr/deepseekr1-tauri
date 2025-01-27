// MarkdownComponents.tsx
import type { Components } from 'react-markdown';

// Export individual components as named exports
export const MarkdownLink: Components['a'] = ({ node, children, ...props }) => (
  <a 
    {...props} 
    target="_blank" 
    rel="noopener noreferrer" 
    className="text-blue-600 hover:underline"
  >
    {children || props.href}
  </a>
);

export const MarkdownCode: Components['code'] = ({ node, className, children, ...props }) => {
  const isInline = !className?.includes('language-');
  
  return isInline ? (
    <code className="bg-gray-200 px-1 rounded" {...props}>
      {children}
    </code>
  ) : (
    <code className={`${className} p-2 block bg-gray-800 text-gray-100 rounded`} {...props}>
      {children}
    </code>
  );
};

export const ReasoningLink: Components['a'] = ({ node, children, ...props }) => (
  <a 
    {...props} 
    className="text-gray-600 hover:text-gray-800 underline"
  >
    {children || props.href}
  </a>
);

// Update your markdownComponents export
export const markdownComponents = {
  a: MarkdownLink,
  code: MarkdownCode,
  reasoningA: ReasoningLink, // Add this line
} as const;

export const reasoningComponents: Components = {
  ...markdownComponents,
  a: ({ node, children, ...props }) => (
    <a 
      {...props} 
      className="text-gray-600 hover:text-gray-800 underline"
    >
      {children || props.href}
    </a>
  )
};