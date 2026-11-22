import { Link } from "@/lib/router-compat";
const CryptogenLogo = "/logos/cryptogen-logo.png";

interface LogoProps {
  linkTo?: string;
  size?: "sm" | "md" | "lg";
  showLink?: boolean;
  className?: string;
}

const Logo = ({ linkTo = "/", size = "md", showLink = true, className = "" }: LogoProps) => {
  const sizeClasses = {
    sm: "h-6",
    md: "h-7",
    lg: "h-9",
  };

  const LogoContent = (
    <div className={`flex items-center ${sizeClasses[size]} ${className}`}>
      <img
        src={CryptogenLogo}
        alt="Cryptogen"
        className="h-full w-auto object-contain"
      />
    </div>
  );

  if (!showLink) {
    return LogoContent;
  }

  return (
    <Link to={linkTo} className="flex items-center">
      {LogoContent}
    </Link>
  );
};

export default Logo;
