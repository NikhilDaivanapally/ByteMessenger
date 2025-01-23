import { useDispatch } from "react-redux";
import "./App.css";
import {
  RouterProvider,
  createBrowserRouter,
  redirect,
} from "react-router-dom";
import { useEffect } from "react";
import Layout from "./pages/Layout/Dashboard";
import { updateOnlineStatus } from "./store/slices/appSlice";
import Signin from "./pages/Auth/Signin.page";
import Signup from "./pages/Auth/Signup.page";
import Forgotpassword from "./pages/Auth/Forgotpassword.page";
import Page404 from "./pages/Page404";
import ConnectPage from "./pages/Connect/Connect.page";
import GroupChat from "./pages/Chat/GroupChat.page";
import DirectChat from "./pages/Chat/DirectChat.page";
import ResetPassword from "./pages/Auth/ResetPassword.page";
import ProfilePage from "./pages/Profile/Profile.page";
import { UpdateAuthState } from "./store/slices/authSlice";

function App() {
  const dispatch = useDispatch();

  // Fetch current logged-in user
  useEffect(() => {
    const fetchCurrentLoggedUser = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/v1/auth/login/success",
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();
        if (data.status == "success") {
          dispatch(UpdateAuthState(data.user));
        }
      } catch (error) {
        // console.error("Error fetching logged-in user:", error);
      }
    };

    fetchCurrentLoggedUser();
  }, [dispatch]);

  // Handle online/offline status
  useEffect(() => {
    function handleUpdateOnlineStatus() {
      dispatch(updateOnlineStatus({ status: navigator.onLine }));
    }

    window.addEventListener("online", handleUpdateOnlineStatus);
    window.addEventListener("offline", handleUpdateOnlineStatus);

    // Initial check when the component mounts
    handleUpdateOnlineStatus();

    return () => {
      window.removeEventListener("online", handleUpdateOnlineStatus);
      window.removeEventListener("offline", handleUpdateOnlineStatus);
    };
  }, [dispatch]);

  // Routes configuration
  const router = createBrowserRouter([
    {
      path: "/login",
      element: <Signin />,
    },
    {
      path: "/signup",
      element: <Signup />,
    },
    {
      path: "/forgot-password",
      element: <Forgotpassword />,
    },
    {
      path: "/reset-password",
      element: <ResetPassword />,
    },
    {
      path: "/",
      element: <Layout />,
      loader: async () => {
        try {
          // Redirect to login if user is not authenticated
          const response = await fetch(
            "http://localhost:8000/api/v1/auth/login/success",
            {
              method: "GET",
              credentials: "include",
            }
          );
          const data = await response.json();
          if (data.status !== "success") {
            return redirect("/login");
          }
          return null; // No redirection
        } catch (error) {
          return redirect("/login");
        }
      },
      children: [
        {
          index: true,
          element: <DirectChat />,
        },
        {
          path: "group",
          element: <GroupChat />,
        },
        {
          path: "connect",
          element: <ConnectPage />,
        },
        {
          path: "profile",
          element: <ProfilePage />,
        },
      ],
    },
    {
      path: "*",
      element: <Page404 />,
    },
  ]);

  return (
    <div className="App">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
