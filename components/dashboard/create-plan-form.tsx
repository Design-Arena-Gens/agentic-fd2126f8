"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UploadCloud } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { studyPlanSchema } from "@/lib/validators";

const enhancedSchema = studyPlanSchema.extend({
  description: z.string().optional(),
  file: z
    .custom<FileList>()
    .refine((files) => files && files.length > 0, "Please upload a PDF file.")
    .refine((files) => files?.[0]?.type === "application/pdf", "Only PDF files are supported.")
});

type FormValues = z.infer<typeof enhancedSchema>;

type Props = {
  isSubmitting: boolean;
  onSubmit: (formData: FormData) => Promise<void> | void;
};

export function CreatePlanForm({ isSubmitting, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(enhancedSchema),
    defaultValues: {
      title: "",
      durationUnit: "weeks",
      durationValue: 4,
      description: ""
    }
  });

  const fileList = watch("file");
  const [notes, setNotes] = useState("");

  const fileName = useMemo(() => {
    if (fileList && fileList.length > 0) {
      return fileList[0].name;
    }
    return "No file selected";
  }, [fileList]);

  const submitForm = handleSubmit(async (values) => {
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("durationUnit", values.durationUnit);
    formData.append("durationValue", String(values.durationValue));
    formData.append("file", values.file[0]);
    if (values.description) {
      formData.append("description", values.description);
    }
    if (notes) {
      formData.append("notes", notes);
    }
    await onSubmit(formData);
    reset();
    setNotes("");
  });

  return (
    <form onSubmit={submitForm} className="space-y-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="title">Plan title</Label>
          <Input
            id="title"
            placeholder="Organic Chemistry revision"
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
          />
          {errors.title && (
            <p className="text-xs text-red-500" role="alert">
              {errors.title.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="durationValue">Completion deadline</Label>
          <div className="flex gap-2">
            <Input
              id="durationValue"
              type="number"
              min={1}
              className="w-24"
              aria-invalid={Boolean(errors.durationValue)}
              {...register("durationValue", { valueAsNumber: true })}
            />
            <select
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus-visible:ring-offset-slate-950"
              {...register("durationUnit")}
            >
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </div>
          {errors.durationValue && (
            <p className="text-xs text-red-500" role="alert">
              {errors.durationValue.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Focus areas (optional)</Label>
        <Textarea
          id="description"
          placeholder="Topics you want the AI to emphasize..."
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="file">Upload PDF</Label>
        <label
          htmlFor="file"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600 transition hover:border-primary hover:bg-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <UploadCloud className="h-8 w-8 text-primary" />
          <span>{fileName}</span>
          <span className="text-xs text-slate-400">
            Drag and drop or click to browse (PDF only, up to 15MB)
          </span>
          <input
            id="file"
            type="file"
            accept="application/pdf"
            className="sr-only"
            {...register("file")}
          />
        </label>
        {errors.file && (
          <p className="text-xs text-red-500" role="alert">
            {errors.file.message?.toString()}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Reminder notes</Label>
        <Textarea
          id="notes"
          placeholder="Add a personal motivation or reminder for notifications."
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            reset();
            setNotes("");
          }}
          disabled={isSubmitting}
        >
          Reset
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Generating..." : "Generate plan"}
        </Button>
      </div>
    </form>
  );
}
