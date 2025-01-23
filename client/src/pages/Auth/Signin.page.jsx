import "./auth.css";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  useLazySuccessQuery,
  useLoginMutation,
} from "../../store/slices/apiSlice";
import ToastConfig from "../../toastConfig/ToastConfig";
import { UpdateAuthState } from "../../store/slices/authSlice";
import InputField from "../../components/Input/Input";
import AuthLoader from "../../components/AuthLoader/AuthLoader";

const Signin = () => {
  const dispatch = useDispatch();
  const Navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);

  // useEffect(() => {
  //   if (!user) {
  //     Navigate("/login");
  //   } else {
  //     Navigate("/");
  //   }
  // }, [user]);

  const [signinFormData, setsigninFormData] = useState({
    email: "",
    password: "",
  });
  const filteredArray = useMemo(
    () =>
      Object.keys(signinFormData).map((key) => {
        return {
          type: key,
          key,
        };
      }),
    []
  );

  const [showPassword, setShowPassword] = useState(false);
  // local login
  const [
    login,
    { isLoading: isLoginLoading, error: loginError, data: loginData },
  ] = useLoginMutation();

  // // google login success
  // const [
  //   triggerLoginUser,
  //   { data: LoginUserData, isSuccess: LoginUserIsSuccess },
  // ] = useLazySuccessQuery();

  // Hook for local login success
  useEffect(() => {
    if (loginData) {
      // localStorage.setItem("auth_id", JSON.stringify(loginData.user));
      dispatch(UpdateAuthState(loginData.user));
      toast.success(loginData.message);
      Navigate("/");
    } else if (loginError) {
      toast.error(loginError?.data?.message || loginError.error);
    }
  }, [loginData, loginError, dispatch, Navigate]);

  // useEffect(() => {
  //   const urlParams = new URLSearchParams(window.location.search);
  //   const success = urlParams.get("success");

  //   if (success === "true") {
  //     triggerLoginUser({});
  //   } else if (success === "false") {
  //     toast.error("Login Failed");
  //     Navigate("/login");
  //   }
  // }, [Navigate]);

  // // Hook for google login sucess
  // useEffect(() => {
  //   if (LoginUserIsSuccess && LoginUserData) {
  //     dispatch(UpdateAuthState(LoginUserData.user));
  //     toast.success(LoginUserData.message);

  //     toast.success("Login success");
  //     Navigate("/");
  //   }
  // }, [LoginUserIsSuccess, LoginUserData]);

  const handleFormSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!Object.values(signinFormData).some((val) => val === "")) {
        await login(signinFormData);
      } else {
        toast.error("All Fields are Required");
      }
    },
    [signinFormData, login]
  );

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setsigninFormData((prev) => ({ ...prev, [name]: value }));
  }, []);
  const handleFocus = useCallback(
    (e) => e.target.nextSibling.classList.add("lift"),
    []
  );
  const handleBlur = useCallback(
    (e) => {
      if (!signinFormData[e.target.name]) {
        e.target.nextSibling.classList.remove("lift");
      }
    },
    [signinFormData]
  );

  const handleGoogleLogin = () => {
    try {
      // Open Google OAuth in a new window
      window.open("http://localhost:8000/api/v1/auth/google", "_self");
    } catch (error) {
      console.error("Error opening Google OAuth window:", error);
    }
  };

  return (
    <div className="page">
      <ToastConfig />
      <div className="container">
        <p className="title">Log In</p>
        <div className="form">
          {filteredArray.map(({ type, key }, i) => (
            <InputField
              key={i}
              type={type}
              name={key}
              value={signinFormData[key]}
              handleInputChange={handleInputChange}
              handleFocus={handleFocus}
              handleBlur={handleBlur}
              handleClick={() => setShowPassword((prev) => !prev)}
              showPassword={showPassword}
            />
          ))}
          <Link to={"/forgot-password"} className="forgot_password">
            Forgot password
          </Link>
          {isLoginLoading ? (
            <button className="btn">
              <AuthLoader />
            </button>
          ) : (
            <button onClick={handleFormSubmit} className="btn">
              Log In
            </button>
          )}
          <div className="sign_with_title">
            <p>or sign in with</p>
          </div>
          <button className="google_btn" onClick={handleGoogleLogin}>
            <svg width="30" height="30" role="img">
              <g id="Google-Button" stroke="none" fill="none">
                <rect x="0" y="0" width="30" height="30" rx="1"></rect>
                <g id="logo_googleg_48dp" transform="translate(5,5) scale(1.2)">
                  <path
                    d="M17.64,9.20454545 C17.64,8.56636364 17.5827273,7.95272727 17.4763636,7.36363636 L9,7.36363636 L9,10.845 L13.8436364,10.845 C13.635,11.97 13.0009091,12.9231818 12.0477273,13.5613636 L12.0477273,15.8195455 L14.9563636,15.8195455 C16.6581818,14.2527273 17.64,11.9454545 17.64,9.20454545 L17.64,9.20454545 Z"
                    id="Shape"
                    fill="#4285F4"
                  ></path>
                  <path
                    d="M9,18 C11.43,18 13.4672727,17.1940909 14.9563636,15.8195455 L12.0477273,13.5613636 C11.2418182,14.1013636 10.2109091,14.4204545 9,14.4204545 C6.65590909,14.4204545 4.67181818,12.8372727 3.96409091,10.71 L0.957272727,10.71 L0.957272727,13.0418182 C2.43818182,15.9831818 5.48181818,18 9,18 L9,18 Z"
                    id="Shape"
                    fill="#34A853"
                  ></path>
                  <path
                    d="M3.96409091,10.71 C3.78409091,10.17 3.68181818,9.59318182 3.68181818,9 C3.68181818,8.40681818 3.78409091,7.83 3.96409091,7.29 L3.96409091,4.95818182 L0.957272727,4.95818182 C0.347727273,6.17318182 0,7.54772727 0,9 C0,10.4522727 0.347727273,11.8268182 0.957272727,13.0418182 L3.96409091,10.71 L3.96409091,10.71 Z"
                    id="Shape"
                    fill="#FBBC05"
                  ></path>
                  <path
                    d="M9,3.57954545 C10.3213636,3.57954545 11.5077273,4.03363636 12.4404545,4.92545455 L15.0218182,2.34409091 C13.4631818,0.891818182 11.4259091,0 9,0 C5.48181818,0 2.43818182,2.01681818 0.957272727,4.95818182 L3.96409091,7.29 C4.67181818,5.16272727 6.65590909,3.57954545 9,3.57954545 L9,3.57954545 Z"
                    id="Shape"
                    fill="#EA4335"
                  ></path>
                </g>
              </g>
            </svg>
            <p>Google</p>
          </button>
        </div>
        <p className="redirect">
          Don't have an account?{" "}
          <Link to={"/signup"} className="to">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signin;
