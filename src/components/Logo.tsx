import { SVGProps } from 'react';
interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  textColor?: string;
}
const Logo = ({
  className = "",
  showText = true,
  size = "md",
  textColor = "text-foreground"
}: LogoProps) => {
  const sizeClasses = {
    sm: {
      container: "w-6 h-6",
      icon: "w-4 h-4",
      text: "text-sm"
    },
    md: {
      container: "w-8 h-8",
      icon: "w-5 h-5",
      text: "text-lg"
    },
    lg: {
      container: "w-12 h-12",
      icon: "w-8 h-8",
      text: "text-2xl"
    }
  };
  return <div className={`flex items-center ${className}`}>
      <div className={`relative ${sizeClasses[size].container} rounded-full flex items-center justify-center`}>
        <img alt="Garage Pro Road Icon" className="object-fill" src="/lovable-uploads/adb79866-2bf5-4349-83d4-0212f37959ca.png" />
      </div>
      {showText && <span className={`ml-2 font-bold ${sizeClasses[size].text} ${textColor}`}>
          GARAGE PRO
        </span>}
    </div>;
};
export default Logo;