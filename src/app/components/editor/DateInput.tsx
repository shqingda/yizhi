import { useId } from "react";
import { Input } from "@/components/ui/input";
export function DateInput({ value, onChange, end = false, start, id: inputId }: { value?: string; onChange: (value: string) => void; end?: boolean; start?: string; id?: string }) {
	const id = useId();
	const date = value ?? "";
	const current = date === "至今";
	const validMonth = /^\d{4}-\d{2}$/;
	const legacyFormat = date && !current && !validMonth.test(date);
	const reversed = end && start && validMonth.test(start) && validMonth.test(date) && date < start;
	return <span className="grid min-w-0 content-start gap-1.5">
		<Input className="px-1" id={inputId} type={legacyFormat || current ? "text" : "month"} disabled={current} value={date} aria-describedby={reversed ? id : undefined} onChange={e => onChange(e.target.value)} />
		{end && <label className="flex items-center gap-2 text-xs"><input type="checkbox" aria-label="至今" checked={current} onChange={e => onChange(e.target.checked ? "至今" : "")} />至今</label>}
		{reversed && <span id={id} className="text-xs text-amber-800">结束时间早于开始时间，请检查。</span>}
	</span>;
}
