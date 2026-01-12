import axios from "axios";
import SummaryApi, { baseURL } from "../common/SummarryAPI";

const Axios = axios.create({
    baseURL: baseURL,
    withCredentials: true
})
Axios.interceptors.request.use(
    async (config: any) => {
        const accessToken = localStorage.getItem('accesstoken')

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// life span accessToken

Axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originRequest = error?.config || {};

        if (error?.response?.status === 401 && !originRequest.retry) {
            originRequest.retry = true;
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
                const newAccessToken = await refreshAccessToken(refreshToken);
                if (newAccessToken) {
                    originRequest.headers = originRequest.headers || {};
                    originRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return Axios(originRequest);
                }
            }
        }

        return Promise.reject(error);
    }
)

const refreshAccessToken = async (refreshToken: any) => {
    try {
        const response = await Axios({
            ...SummaryApi.refreshToken,
            headers: {
                Authorization: `Bearer ${refreshToken}`
            }
        })

        const accessToken = response.data.data.accessToken
        localStorage.setItem('accesstoken', accessToken)
        return accessToken
    } catch (error) {
        // Error handled silently
    }
}
export default Axios