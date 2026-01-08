import { useSession } from "next-auth/react";
import { ReactNode, useState } from "react";
import { AuthDialog } from "./auth-dialog";
import React from "react";

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { data: session } = useSession();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  if (session) {
    return <>{children}</>;
  }

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAuthDialog(true);
  };

  // 安全地处理 children，支持多种类型的子元素
  const renderChildren = () => {
    // 如果 children 是单个有效的 React 元素，则克隆并添加事件处理
    if (React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick: handleAction,
        className: `${(children as any).props.className || ''} cursor-pointer`.trim()
      });
    }
    
    // 如果 children 是多个元素或其他类型，包装在一个 div 中
    return (
      <div onClick={handleAction} className="cursor-pointer">
        {children}
      </div>
    );
  };

  return (
    <>
      {renderChildren()}
      <AuthDialog 
        isOpen={showAuthDialog} 
        onClose={() => setShowAuthDialog(false)} 
      />
    </>
  );
} 