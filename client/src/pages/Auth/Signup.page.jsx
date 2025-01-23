import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./auth.css";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useOtpsubmitMutation,
  useSignupMutation,
} from "../../store/slices/apiSlice";
import ToastConfig from "../../toastConfig/ToastConfig";
import { useDispatch } from "react-redux";
import { UpdateAuthState } from "../../store/slices/authSlice";
import InputField from "../../components/Input/Input";
import AuthLoader from "../../components/AuthLoader/AuthLoader";
const Signup = () => {
  const dispatch = useDispatch();
  const Navigate = useNavigate();
  const length = 6;
  const [showpassword, setShowpassword] = useState({
    password: false,
    confirmPassword: false,
  });
  const [signupFormData, setsignupFormData] = useState({
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    about: "",
    gender: "",
    avatar: null,
  });
  const [otp, setOtp] = useState(new Array(length).fill(""));
  const inputRefs = useRef([]);

  const [
    signup,
    { isLoading: isSignupLoading, error: signupError, data: signupData },
  ] = useSignupMutation();

  const [
    otpsubmit,
    {
      isLoading: isOtpSubmitLoading,
      error: otpsubmitError,
      data: otpsubmitData,
    },
  ] = useOtpsubmitMutation();

  const filteredArray = useMemo(
    () =>
      Object.keys(signupFormData)
        .map((key) => {
          switch (key) {
            case "userName":
              return {
                type: "text",
                key,
              };
            case "email":
              return {
                type: "email",
                key,
              };
            case "password":
              return {
                type: "password",
                key,
              };
            case "confirmPassword":
              return {
                type: "password",
                key,
              };
            default:
              return;
          }
        })
        .filter((el) => el),
    []
  );

  useEffect(() => {
    if (signupData) {
      toast.success(signupData.message);
    } else if (signupError) {
      toast.error(signupError.data?.message);
    }
  }, [signupData, signupError]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
    if (otpsubmitData) {
      dispatch(UpdateAuthState(otpsubmitData.user));
      localStorage.setItem("auth_id", JSON.stringify(otpsubmitData.user));
      toast.success(otpsubmitData.message);
      Navigate("/");
    } else if (otpsubmitError) {
      toast.error(otpsubmitError.data.message);
    }
  }, [otpsubmitError, otpsubmitData]);

  // handling form submit
  const handleFormSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      let testCase = [
        signupFormData.userName,
        signupFormData.email,
        signupFormData.password,
        signupFormData.confirmPassword,
        signupFormData.gender,
      ].some((val) => val == "");

      if (!testCase) {
        const data = new FormData();
        for (let key in signupFormData) {
          data.append(key, signupFormData[key]);
        }

        await signup(data);
      } else {
        toast.error("Star marked fields are required !");
      }
    },
    [signupFormData]
  );

  // to preview the avatar uploaded by user by Generating the url
  const avatarUrl = useMemo(() => {
    if (signupFormData?.avatar) {
      return URL.createObjectURL(signupFormData.avatar);
    }
  }, [signupFormData?.avatar]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setsignupFormData((prev) => ({ ...prev, [name]: value }));
    e.target.name !== "gender" && e.target.nextSibling.classList.add("lift");
  }, []);

  const handleFileChange = useCallback((e) => {
    const { name, files } = e.target;
    setsignupFormData((prev) => ({ ...prev, [name]: files[0] }));
  }, []);

  // verifyOtp code
  const handleOtpChange = useCallback(
    (index, e) => {
      const value = e.target.value;
      if (isNaN(value)) return;
      const newotp = [...otp];
      newotp[index] = value.substring(value.length - 1);
      setOtp(newotp);

      if (value && index < length - 1 && inputRefs.current[index + 1]) {
        if (otp[index + 1]) {
          inputRefs.current[otp.indexOf("")].focus();
        } else {
          inputRefs.current[index + 1].focus();
        }
      }
    },
    [otp]
  );

  // handle keydown
  const handleKeydown = useCallback(
    (index, e) => {
      if (
        e.key === "Backspace" &&
        !otp[index] &&
        index > 0 &&
        inputRefs.current[index - 1]
      ) {
        inputRefs.current[index - 1].focus();
      }
    },
    [otp]
  );

  // otp verify
  const handleOtpsubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!otp.some((val) => val == "")) {
        await otpsubmit({
          email: signupFormData.email,
          otp: otp.join(""),
        });
      } else {
        toast.error("fields should not be empty");
      }
    },
    [otp]
  );

  const handleclick = useCallback((index) => {
    inputRefs.current[index].setSelectionRange(1, 1);
    if (index > 0 && !otp[index - 1]) {
      inputRefs.current[otp.indexOf("")].focus();
    }
  }, []);

  const handleFocus = useCallback(
    (e) => e.target.nextSibling.classList.add("lift"),
    []
  );
  const handleBlur = useCallback(
    (e) => {
      if (!signupFormData[e.target.name]) {
        e.target.nextSibling.classList.remove("lift");
      }
    },
    [signupFormData]
  );

  const handleGoogleSignup = () => {
    try {
      // Open Google OAuth in a new window
      window.open("https://byte-messenger-api.onrender.com/api/v1/auth/google", "_self");
    } catch (error) {
      console.error("Error opening Google OAuth window:", error);
    }
  };

  return (
    <div className="page">
      {/* Toaster */}
      <ToastConfig />
      {!signupData ? (
        <div className="container">
          <p className="title">Sign Up</p>
          <div className="form">
            {/* file */}
            <div className="inpt_file">
              <label>Avatar</label>
              <div className="choose">
                <input
                  type="file"
                  id="select"
                  name="avatar"
                  hidden
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {!signupFormData.avatar ? (
                  <label htmlFor="select" className="select">
                    Choose File
                  </label>
                ) : (
                  <label>{signupFormData.avatar.name}</label>
                )}
                {avatarUrl && (
                  <div className="previewer">
                    <img src={avatarUrl} alt="avatar" />
                  </div>
                )}
              </div>
            </div>
            {/* text */}

            {filteredArray.map(({ type, key }, i) => (
              <InputField
                key={i}
                type={type}
                name={key}
                value={signupFormData[key]}
                handleInputChange={handleInputChange}
                handleFocus={handleFocus}
                handleBlur={handleBlur}
                handleClick={() =>
                  setShowpassword({
                    ...showpassword,
                    [key]: !showpassword[key],
                  })
                }
                showPassword={showpassword[key]}
              />
            ))}

            <div className="inpt_tag">
              <textarea
                className="txt"
                type="text"
                name="about"
                value={signupFormData.about}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              <span className="input_name">About</span>
            </div>

            {/* Gender Section */}
            <div className="Gender_container">
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  onChange={handleInputChange}
                />
                Male
              </label>{" "}
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  onChange={handleInputChange}
                />
                Female
              </label>{" "}
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="others"
                  onChange={handleInputChange}
                />
                others
              </label>
            </div>

            {/* submit button */}
            {isSignupLoading ? (
              <button className="btn">
                <AuthLoader />
              </button>
            ) : (
              <button onClick={handleFormSubmit} className="btn">
                Sign Up
              </button>
            )}

            <div className="sign_with_title">
              <p>or sign up with</p>
            </div>
            <button className="google_btn" onClick={handleGoogleSignup}>
              <svg width="30" height="30" role="img">
                <g id="Google-Button" stroke="none" fill="none">
                  <rect x="0" y="0" width="30" height="30" rx="1"></rect>
                  <g
                    id="logo_googleg_48dp"
                    transform="translate(5,5) scale(1.2)"
                  >
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
            Already have an account ?
            <Link to={"/login"} className="to">
              Log In
            </Link>
          </p>
        </div>
      ) : (
        <div className="otp_container">
          <div className="title">
            <p>we have sent a verification code to </p>
            <p>{signupFormData.email}</p>
          </div>
          <form className="otp_form" onSubmit={handleOtpsubmit}>
            <div>
              {otp.map((value, index) => {
                return (
                  <input
                    className="otp_box"
                    key={`inpt_${index}`}
                    ref={(input) => (inputRefs.current[index] = input)}
                    type="text"
                    value={value}
                    onClick={() => handleclick(index)}
                    onChange={(e) => handleOtpChange(index, e)}
                    onKeyDown={(e) => handleKeydown(index, e)}
                  />
                );
              })}
            </div>
            <button type="submit" className="btn">
              {isOtpSubmitLoading ? <AuthLoader /> : "verify otp"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Signup;
