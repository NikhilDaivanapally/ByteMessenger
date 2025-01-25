import React, { useCallback, useEffect, useState } from "react";
import { useForgotpassMutation } from "../../store/slices/apiSlice";
import toast from "react-hot-toast";
import logo from "../../assests/free-chat-icon-download-in-svg-png-gif-file-formats--bubble-notification-sms-lined-pack-user-interface-icons-431107.png";
import "./auth.css";
import InputField from "../../components/Input/Input";
import AuthLoader from "../../components/AuthLoader/AuthLoader";
import { Link } from "react-router-dom";
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
  return (
    <div className="page">
      <div className="brand">
        <img src={logo} alt="" width={30} />
        <p className="">Byte Messenger</p>
      </div>
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
              />
              <button type="submit" className="btn">
                {isLoading ? <AuthLoader /> : "send password reset link"}
              </button>
            </form>
          </>
        ) : (
          <p className="success">
            password reset link has been sent to <br /> <b>{email}</b>
          </p>
        )}
        <p className="redirect">
          Get Back to{" "}
          <Link to={"/login"} className="to">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Forgotpassowrd;
