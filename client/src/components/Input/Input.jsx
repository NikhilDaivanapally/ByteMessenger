import { IoMdEye, IoMdEyeOff } from "react-icons/io";

const InputField = ({
  type,
  name,
  value,
  handleInputChange,
  handleBlur,
  handleFocus,
  handleClick = () => {},
  showPassword = false,
}) => {
  return (
    <>
      {name != "password" &&
      name != "confirmPassword" &&
      name != "NewPassword" &&
      name != "confirmNewPassword" ? (
        <div className="inpt_tag">
          <input
            className={`inpt ${type === "password" ? "inptpass" : ""}`}
            type={type}
            name={name}
            value={value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <span className="input_name">
            {name.charAt(0).toUpperCase() + name.slice(1)} *
          </span>
        </div>
      ) : (
        <div className="inpt_tag">
          <input
            className={`inpt ${type === "password" ? "inptpass" : ""}`}
            type={showPassword ? "text" : "password"}
            name={name}
            value={value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <span className="input_name">
            {name.charAt(0).toUpperCase() + name.slice(1)} *
          </span>
          <div className="showpassword_toggle" onClick={handleClick}>
            {showPassword ? (
              <IoMdEyeOff className="icon" />
            ) : (
              <IoMdEye className="icon" />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default InputField;
