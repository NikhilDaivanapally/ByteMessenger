import React, { useCallback, useEffect, useState } from "react";
import { useForgotpassMutation } from "../../store/slices/apiSlice";
import toast from "react-hot-toast";

import "./auth.css";
import ToastConfig from "../../toastConfig/ToastConfig";
import InputField from "../../components/Input/Input";
import AuthLoader from "../../components/AuthLoader/AuthLoader";
const Forgotpassowrd = () => {
  const [email, setEmail] = useState("");
  const [forgotpass, { isLoading, error, data }] = useForgotpassMutation();
  useEffect(() => {
    data && toast.success(data.message);
    error && toast.error(error.data.message);
  }, [error, data]);

  const handleInputChange = useCallback((e) => setEmail(e.target.value), []);

  const handlesubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (email) {
        await forgotpass({ email });
      }
    },
    [email]
  );

  const handleFocus = (e) => e.target.nextSibling.classList.add("lift");
  const handleBlur = (e) => {
    !email && e.target.nextSibling.classList.remove("lift");
  };
  return (
    <div className="page">
      {/* Toaster */}
      <ToastConfig />
      <div className="container">
        <p className="title">Forgot password</p>
        {!data ? (
          <>
            <p className="info">We'll email you a password reset link.</p>
            <form onSubmit={handlesubmit} className="form">
              <InputField
                type={"text"}
                name={"email"}
                value={email}
                handleInputChange={handleInputChange}
                handleFocus={handleFocus}
                handleBlur={handleBlur}
              />
              <button type="submit" className="btn">
                {isLoading ? (
                  <AuthLoader/>
                ) : (
                  "send password reset link"
                )}
              </button>
            </form>
          </>
        ) : (
          <p className="success">
            password reset link has been sent to <br /> <b>{email}</b>
          </p>
        )}
      </div>
    </div>
  );
};

export default Forgotpassowrd;
