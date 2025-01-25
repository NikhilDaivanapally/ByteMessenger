import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./auth.css";
import { useResetpassMutation } from "../../store/slices/apiSlice";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import InputField from "../../components/Input/Input";
import AuthLoader from "../../components/AuthLoader/AuthLoader";

const ResetPassword = () => {
  const [resetFormData, setResetFormData] = useState({
    NewPassword: "",
    confirmNewPassword: "",
  });

  const filteredArray = useMemo(
    () =>
      Object.keys(resetFormData).map((key) => {
        return {
          type: "password",
          key,
        };
      }),
    []
  );

  const [showpassword, setShowpassword] = useState({
    NewPassword: false,
    confirmNewPassword: false,
  });
  const [resetpass, { isLoading, error, data }] = useResetpassMutation();

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setResetFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  useEffect(() => {
    if (data) {
      toast.success(data.message);
    } else if (error) {
      toast.error(error.data.message);
    }
  }, [error, data]);

  const handleSubmit = useCallback(
    async (e) => {
      console.log(resetFormData);
      e.preventDefault();
      if (!Object.values(resetFormData).some((val) => val == "")) {
        await resetpass(resetFormData);
      } else {
        toast.error("All Fields are Required");
      }
    },
    [resetFormData]
  );

  return (
    <div className="page">
      <div className="container">
        <p className="title">Reset password</p>
        {!data ? (
          <>
            <p className="info">Set your New Password below</p>
            <form onSubmit={handleSubmit} className="form">
              {filteredArray.map(({ type, key }, i) => (
                <InputField
                  key={i}
                  type={type}
                  name={key}
                  value={resetFormData[key]}
                  handleInputChange={handleInputChange}
                  handleClick={() =>
                    setShowpassword({
                      ...showpassword,
                      [key]: !showpassword[key],
                    })
                  }
                  showPassword={showpassword[key]}
                />
              ))}
              <button type="submit" className="btn">
                {isLoading ? <AuthLoader /> : "Reset password"}
              </button>
            </form>
          </>
        ) : (
          <p className="success">
            password reset successfull <br />{" "}
            <Link to={"/login"}>Back to Login</Link>
          </p>
        )}
      </div>
    </div>
  );
};
export default ResetPassword;
