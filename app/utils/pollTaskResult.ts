import { api } from "@/app/api";

type TaskStatus = "PENDING" | "STARTED" | "SUCCESS" | "FAILURE";

type TaskResultResponse<T> = {
  status: TaskStatus;
  result: T | string | null;
};

type PollOptions<T> = {
  taskId: string;
  intervalMs?: number;
  onSuccess: (result: T) => void;
  onFailure: (error: string) => void;
  onError?: () => void;
};

// check status of task and set result to onSuccess or onFailure
export function pollTaskResult<T>({
  taskId,
  intervalMs = 5000,
  onSuccess,
  onFailure,
  onError,
}: PollOptions<T>): ReturnType<typeof setInterval> {
  const intervalId = setInterval(async () => {
    try {
      const response = await api.get(`api/task-result/${taskId}/`);
      const { status, result } = response.data as TaskResultResponse<T>;
      console.log("status: ", status);
      console.log("result: ", result);

      if (status === "SUCCESS") {
        console.log("!!!!! SUCCESS");
        console.log("result: ", result);
        clearInterval(intervalId);
        onSuccess(result as T);
      } else if (status === "FAILURE") {
        console.log("!!!!! FAILURE");
        console.log("result: ", result);
        clearInterval(intervalId);
        onFailure(typeof result === "string" ? result : "An unexpected error occurred.");
      }
      // PENDING and STARTED: keep polling
    } catch {
      clearInterval(intervalId);
      onError?.();
      // Toast shown by api interceptor
    }
  }, intervalMs);

  return intervalId;
}
