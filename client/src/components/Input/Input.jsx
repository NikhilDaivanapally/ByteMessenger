import { IoMdEye, IoMdEyeOff } from "react-icons/io";

const InputField = ({
  type,
  name,
  value,
  handleInputChange,
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
            placeholder={`${name} *`}
            required={true}
          />
        </div>
      ) : (
        <div className="inpt_tag">
          <input
            className={`inpt ${type === "password" ? "inptpass" : ""}`}
            type={showPassword ? "text" : "password"}
            name={name}
            value={value}
            onChange={handleInputChange}
            placeholder={`${name} *`}
          />

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
