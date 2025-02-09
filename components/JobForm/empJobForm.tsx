"use client";
import { useState, useEffect } from "react";
import { SFProRounded } from "@/app/layout";

import {
  Button,
  TextInput,
  Select,
  NumberInput,
  Textarea,
  FileInput,
  Group,
  Box,
  Grid,
  Modal,
  Text,
  Title,
  TagsInput,
  RangeSlider,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
import Search from "../Search";
import PaymentForm from "@/components/Payment/Payment";
import { saveJob } from "@/app/post-job/action";
const validationSchema = Yup.object().shape({
  // imageUrl: Yup.mixed()
  //   .required("Company logo is required")
  //   .test(
  //     "fileType",
  //     "Only image files (JPG, JPEG, PNG, WEBP, AVIF) are allowed",
  //     (value) => {
  //       console.log("======value", value);
  //       if (!value || !(value as File).type) {
  //         return false;
  //       }
  //       const allowedTypes = [
  //         "image/jpeg",
  //         "image/png",
  //         "image/jpg",
  //         "image/webp",
  //         "image/avif",
  //       ];
  //       return allowedTypes.includes((value as File).type);
  //     }
  //   ),
  imageUrl: Yup.mixed()
    .test("requiredOrUrl", "Company logo is required", (value) => {
      // Check if the value is either a file or a valid image URL
      if (!value) {
        return false; // If no image and no URL, return false
      }

      // If the value is a URL, skip file type validation
      if (typeof value === "string" && value.startsWith("http")) {
        return true; // It's a valid URL, so we pass
      }

      // File validation for uploaded images
      if (value instanceof File) {
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/jpg",
          "image/webp",
          "image/avif",
        ];
        return allowedTypes.includes(value.type);
      }

      return false; // If the value is neither a valid file nor URL, return false
    })
    .required("Company logo is required"),

  employerName: Yup.string()
    .required("Employer Name is required")
    .transform((value) => (value === "" ? null : value))
    .test(
      "no-spaces-only",
      "Employer Name cannot contain only spaces",
      (value) => {
        if (!value) return true;
        return value.trim().length > 0;
      }
    )
    .min(2, "Employer Name must be at least 2 characters long")
    .max(50, "Employer Name cannot exceed 50 characters")
    .matches(
      /^[a-zA-Z0-9]+(?:[-'\s][a-zA-Z0-9]+)*$/,
      "Employer Name can only include letters, numbers, spaces, hyphens, and apostrophes"
    ),

  employerWebsite: Yup.string()
    .required("Employer website is required")
    .test("url", "Invalid website URL", (value) => {
      if (!value) return true;
      const urlPattern =
        /^(?:http:\/\/|https:\/\/)?(?:www\.)?[\w-]+(?:\.[\w-]+)*(?:\.[a-z]{2,})(?:\/[\w-./?%&=]*)?$/i;
      return urlPattern.test(value);
    }),
  jobTitle: Yup.string()
    .required("Job title is required")
    .transform((value) => (value === "" ? null : value))
    .test("no-spaces-only", "Job title cannot contain only spaces", (value) => {
      if (!value) return true;
      return value.trim().length > 0;
    })
    .min(2, "Job title must be at least 2 characters long")
    .max(50, "Job title cannot exceed 50 characters")
    .matches(
      /^[a-zA-Z0-9]+(?:[-'\s][a-zA-Z0-9]+)*$/,
      "Job title can only include letters, numbers, spaces, hyphens, and apostrophes"
    ),
  jobType: Yup.string().required("Job type is required"),
  solutionArea: Yup.string().required("Solution area is required"),
  jobLocation: Yup.string()
    .required("Job location is required")
    .transform((value) => (value === "" ? null : value))
    .test(
      "no-spaces-only",
      "Job Location cannot contain only spaces",
      (value) => {
        if (!value) return true;
        return value.trim().length > 0;
      }
    )
    .min(2, "Job Location must be at least 2 characters long")
    .max(50, "Job Location cannot exceed 50 characters")
    .matches(
      /^[a-zA-Z0-9]+(?:[-'\s][a-zA-Z0-9]+)*$/,
      "Job Location can only include letters, numbers, spaces, hyphens, and apostrophes"
    ),
  workplaceType: Yup.string().required("Workplace type is required"),
  salaryMin: Yup.number()
    .nullable()
    .transform((value, originalValue) =>
      originalValue === "" ? undefined : Number(originalValue)
    )

    .min(1, "Minimum salary must be greater than 0"),
  salaryMax: Yup.number()
    .nullable()
    .transform((value, originalValue) =>
      originalValue === "" ? undefined : Number(originalValue)
    )
    .test(
      "max-salary-test",
      "Maximum salary must be greater than minimum salary",
      function (value) {
        const { salaryMin } = this.parent;

        // Only validate if salaryMin has a value
        if (!salaryMin) {
          return true;
        }

        console.log("Current max value:", value);
        console.log("Current min value:", salaryMin);
        console.log(
          "Parent object:",
          this.parent,
          Number(value),
          Number(salaryMin),
          Number(value) >= Number(salaryMin)
        );

        return Number(value) >= Number(salaryMin);
      }
    ),

  // .test(
  //   "max-salary-test",
  //   "Maximum salary must be greater than minimum salary",
  //   function (value) {
  //     const { salaryMin } = this.parent;
  //     console.log("Current max value:", value);
  //     console.log("Current min value:", salaryMin);
  //     console.log(
  //       "Parent object:",
  //       this.parent,
  //       Number(value),
  //       Number(salaryMin),
  //       Number(value) >= Number(salaryMin)
  //     );
  //     return Number(value) >= Number(salaryMin);
  //   }
  // ),
  experience: Yup.number()
    .required("Years of experience is required")
    .typeError("Years of experience is required")
    .min(0, "Experience must be at least 0 years"),

  // deadline: Yup.date()
  //   .min(new Date(), "Deadline must not be less than today")
  //   .required("Deadline is required"),
  deadline: Yup.date()
    // .nullable()
    .required("Deadline is required")
    .test("is-future-date", "Deadline must not be less than today", (value) => {
      if (!value) return true; // Skip validation if no date is selected (handled by .required())
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to compare only dates
      return value >= today;
    }),
  skills: Yup.array()
    .of(Yup.string().required("Each skill is required"))
    .min(1, "At least one skill is required")
    .required("Skills are required"),
  jobDescription: Yup.string()
    .required("Job Description is required")
    .transform((value) => (value === "" ? null : value))
    .test(
      "no-spaces-only",
      "Job Description cannot contain only spaces",
      (value) => {
        if (!value) return true;
        return value.trim().length > 0;
      }
    )
    .min(2, "Job Description must be at least 2 characters long"),
});
const draftValidationSchema = Yup.object().shape({
  imageUrl: Yup.mixed()
    .nullable()
    .test(
      "fileType",
      "Only image files (JPG, JPEG, PNG, WEBP,  AVIF) are allowed",
      (value) => {
        if (!value) return true;
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/jpg",
          "image/webp",
          "image/avif",
        ];
        return allowedTypes.includes((value as File).type);
      }
    ),
  employerName: Yup.string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .test(
      "no-spaces-only",
      "Employer Name cannot contain only spaces",
      (value) => {
        if (!value) return true;
        return value.trim().length > 0;
      }
    )
    .min(2, "Employer Name must be at least 2 characters long")
    .max(50, "Employer Name cannot exceed 50 characters")
    .matches(
      /^[a-zA-Z0-9]+(?:[-'\s][a-zA-Z0-9]+)*$/,
      "Employer Name can only include letters, numbers, spaces, hyphens, and apostrophes"
    ),

  employerWebsite: Yup.string()
    .nullable()
    .test("url", "Invalid website URL", (value) => {
      if (!value) return true;
      const urlPattern =
        /^(?:http:\/\/|https:\/\/)?(?:www\.)?[\w-]+(?:\.[\w-]+)*(?:\.[a-z]{2,})(?:\/[\w-./?%&=]*)?$/i;
      return urlPattern.test(value);
    }),
  jobTitle: Yup.string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .test("no-spaces-only", "Job title cannot contain only spaces", (value) => {
      if (!value) return true;
      return value.trim().length > 0;
    })
    .min(2, "Job title must be at least 2 characters long")
    .max(50, "Job title cannot exceed 50 characters")
    .matches(
      /^[a-zA-Z0-9]+(?:[-'\s][a-zA-Z0-9]+)*$/,
      "Job title can only include letters, numbers, spaces, hyphens, and apostrophes"
    ),
  jobType: Yup.string().nullable(),
  solutionArea: Yup.string().nullable(),
  jobLocation: Yup.string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .test(
      "no-spaces-only",
      "Job Location cannot contain only spaces",
      (value) => {
        if (!value) return true;
        return value.trim().length > 0;
      }
    )
    .min(2, "Job Location must be at least 2 characters long")
    .max(50, "Job Location cannot exceed 50 characters")
    .matches(
      /^[a-zA-Z0-9]+(?:[-'\s][a-zA-Z0-9]+)*$/,
      "Job Location can only include letters, numbers, spaces, hyphens, and apostrophes"
    ),

  workplaceType: Yup.string().nullable(),
  salaryMin: Yup.number()
    .nullable()
    .transform((value, originalValue) =>
      originalValue === "" ? null : Number(originalValue)
    )
    .test("optional-min-salary", "Invalid minimum salary", function (value) {
      return !value || value > 1;
    }),

  salaryMax: Yup.number()
    .nullable()
    .transform((value, originalValue) =>
      originalValue === "" ? null : Number(originalValue)
    )
    .test(
      "optional-max-salary",
      "Maximum salary must be greater than minimum salary",
      function (value) {
        const { salaryMin } = this.parent;
        return !value || !salaryMin || value >= salaryMin;
      }
    ),
  experience: Yup.number()
    .nullable()
    .transform((value) => (isNaN(value) ? null : value))
    .min(0, "Experience must be at least 0 years")
    .test("optional-validation", "Invalid experience value", function (value) {
      return !value || (value >= 0 && Number.isInteger(value));
    }),
  // deadline: Yup.date()
  //   .min(new Date(), "Deadline must not be less than today")
  //   .nullable(),
  deadline: Yup.date()
    .nullable()
    .test("is-future-date", "Deadline must not be less than today", (value) => {
      if (!value) return true; // Skip validation if no date is selected (handled by .required())
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to compare only dates
      return value >= today;
    }),
  skills: Yup.array()
    .nullable()
    .transform((value) => (!value ? [] : value))
    .of(Yup.string().trim())
    .test("optional-skills", "Invalid skills format", function (value) {
      return (
        !value?.length ||
        (value.length > 0 &&
          value.every(
            (skill) => typeof skill === "string" && skill.trim().length > 0
          ))
      );
    }),
  jobDescription: Yup.string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .test(
      "no-spaces-only",
      "Job Description cannot contain only spaces",
      (value) => {
        if (!value) return true;
        return value.trim().length > 0;
      }
    )
    .min(2, "Job Description must be at least 2 characters long"),
});

type Props = {
  searchParams: {
    id?: any;
    message?: string;
    action?: string;

  };

  data: any;
 
};

const EmpJobForm = ({ searchParams, data, }: Props) => {
  let formValue = null;
  console.log("FFFFFFFFFFFFFFFFFFFFF", data);
  if (data?.[0]?.application_deadline)
    formValue = new Date(data[0].application_deadline);

  const [formData, setFormData] = useState({
    companyLogo: data?.[0]?.company_logo || "",
    employerName: data?.[0]?.company_name || "",
    employerWebsite: data?.[0]?.links[0] || "",
    jobTitle: data?.[0]?.job_title || "",
    jobType: data?.[0]?.employment_type || "",
    solutionArea: data?.[0]?.solution_area || "",
    jobLocation: data?.[0]?.job_location || "",
    workplaceType: data?.[0]?.remote
      ? "Remote"
      : data?.[0]?.remote === false
      ? "On-Site"
      : null, // Example for aa default type
    salaryMin: data?.[0]?.salary_min || "",
    salaryMax: data?.[0]?.salary_max || "",
    // salaryRange: data?.[0]?.salary_range || "",
    experience: data?.[0]?.years_of_experience || "",
    deadline: formValue,
    skills: data?.[0]?.skills || [],
    jobDescription: data?.[0]?.job_description || "",
    isDraft: false,
    imageUrl: data?.[0]?.employer_logo || null,
    jobId: data?.[0]?.id || "",
  });
  // const [formData, setFormData] = useState({
  //   companyLogo: null,
  //   employerName: "",
  //   employerWebsite: "",
  //   jobTitle: "",
  //   jobType: "",
  //   solutionArea: "",
  //   jobLocation: "",
  //   workplaceType: "",
  //   salaryRange: "",
  //   experience: "",
  //   deadline: null,
  //   skills: [],
  //   jobDescription: "",
  //   isDraft: false,
  //   salaryMin: "",
  //   salaryMax: "",
  //   imageUrl: "",
  // });
  const router = useRouter();
  const [errors, setErrors] = useState<{ [key: string]: string | undefined }>(
    {}
  );
  const [isModalOpen, setModalOpen] = useState(false);
  const [isModalClose, setModalClose] = useState(false);
  const [ModalText, setModalText] = useState("");
  const [ModalTitle, setModalTitle] = useState("");
  const [warningModal, setWarningModal] = useState(false);
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobId, setJobId] = useState("");
  const [isDraftSaving, setIsDraftSaving] = useState(false);

  //const acceptedFormats = "Only .jpg, .jpeg, .png .webp, .avif formats allowed";
  const acceptedFormats =
    "Logo must be in .jpg, .jpeg, .png .webp, .avif formats";
  useEffect(() => {
    console.log("Modal1");

    if (isModalClose) {
      console.log("Modal2");
      return redirect("/my-drafts");
    }
  }, [isModalClose]);

  useEffect(() => {
    console.log("Modal1111111111111------", searchParams, searchParams?.action);
    if (searchParams.action === "payment") {
      handleSubmit({ action: "payment" });
    }
  }, []);

  const handleImageUpload = (file: any) => {
    if (!file) return Promise.reject(new Error("No file provided"));

    if (file instanceof File) {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      return new Promise((resolve, reject) => {
        reader.onload = () => {
          const base64Data = reader.result;

          fetch("/api/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              file: base64Data,
              fileName: file.name,
            }),
          })
            .then((response) => {
              console.log("RESPONSE", response);
              if (!response.ok) {
                throw new Error("Upload failed");
              }
              return response.json();
            })
            .then((data) => {
              setFormData((prev) => ({ ...prev, ["imageUrl"]: data.url }));
              console.log("DataTATA", data);
              resolve(data?.url);
            })
            .catch((error) => {
              console.error("Upload error:", error);
              reject(error);
            });
        };

        reader.onerror = () => {
          reject(new Error("File reading failed"));
        };
      });
    }

    return Promise.reject(new Error("Invalid file type"));
  };

  // const validateField = async (fieldName: string, value: any) => {
  //   try {
  //     console.log("Validation", value);
  //     if (fieldName === "salaryMax")
  //       await draftValidationSchema.validateAt(fieldName, {
  //         [fieldName]: value,
  //         salaryMin: formData.salaryMin,
  //       });
  //     else
  //       await draftValidationSchema.validateAt(fieldName, {
  //         [fieldName]: value,
  //       });
  //     setErrors((prev) => {
  //       const { [fieldName]: _, ...rest } = prev; // Remove the field from the errors object
  //       return rest; // Return the new object without the specified field
  //     });
  //   } catch (error) {
  //     if (error instanceof Yup.ValidationError) {
  //       setErrors((prev) => ({ ...prev, [fieldName]: error.message }));
  //     }
  //   }
  // };
  const validateField = (fieldName: string, value: any) => {
    console.log("Validation", value);

    let validationPromise;

    if (fieldName === "salaryMax") {
      validationPromise = draftValidationSchema.validateAt(fieldName, {
        [fieldName]: value,
        salaryMin: formData.salaryMin,
      });
    } else {
      validationPromise = draftValidationSchema.validateAt(fieldName, {
        [fieldName]: value,
      });
    }

    return validationPromise
      .then(() => {
        setErrors((prev) => {
          const { [fieldName]: _, ...rest } = prev; // Remove the field from the errors object
          return rest; // Return the new object without the specified field
        });
      })
      .catch((error) => {
        if (error instanceof Yup.ValidationError) {
          setErrors((prev) => ({ ...prev, [fieldName]: error.message }));
        }
      });
  };

  // const handleInputChange = async (key: string, value: any) => {
  //   console.log("handle", key, value, formData);
  //   if (key === "imageUrl" && value) {
  //     setImageFile(value);
  //     setFormData((prev) => ({ ...prev, ["imageUrl"]: value }));
  //   }

  //   setFormData((prev) => ({ ...prev, [key]: value }));
  //   await validateField(key, value);
  // };

  const handleInputChange = (key: string, value: any) => {
    console.log("handle", key, value, formData);

    if (key === "imageUrl" && value) {
      setImageFile(value);
      setFormData((prev) => ({ ...prev, ["imageUrl"]: value }));
    }

    setFormData((prev) => ({ ...prev, [key]: value }));

    validateField(key, value)
      .then(() => {
        console.log(`Validation succeeded for ${key}`);
      })
      .catch((error) => {
        console.error(`Validation failed for ${key}:`, error);
      });
  };

  // const validateForm = async (): Promise<boolean> => {
  //   try {
  //     await validationSchema.validate(formData, { abortEarly: false });
  //     console.log("NOOOOOO ERRRRRORRRRS")
  //     setErrors({});
  //     return true;
  //   } catch (validationErrors) {
  //     console.log("ERROR: " + validationErrors)
  //     if (validationErrors instanceof Yup.ValidationError) {
  //       const formErrors: { [key: string]: string } = {};
  //       validationErrors.inner.forEach((error) => {
  //         formErrors[error.path || ""] = error.message;
  //       });
  //       console.log("formErrorssss", formErrors);
  //       setErrors(formErrors);
  //     }
  //     return false;
  //   }
  // };

  const validateForm = (): Promise<boolean> => {
    return validationSchema
      .validate(formData, { abortEarly: false })
      .then(() => {
        console.log("NOOOOOO ERRRRRORRRRS");
        setErrors({});
        return true;
      })
      .catch((validationErrors) => {
        console.log("ERROR: " + validationErrors);
        if (validationErrors instanceof Yup.ValidationError) {
          const formErrors: { [key: string]: string } = {};
          validationErrors.inner.forEach((error) => {
            formErrors[error.path || ""] = error.message;
          });
          console.log("formErrorssss", formErrors);
          setErrors(formErrors);
        }
        return false;
      });
  };

  const hasAtLeastOneField = () => {
    const { isDraft, ...dataToCheck } = formData;
    return Object.entries(dataToCheck).some(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (value === null || value === undefined) {
        return false;
      }
      return value.toString().trim() !== "";
    });
  };
  console.log("================================", errors);

  // const handleSubmit = async ({
  //   is_draft,
  //   action,
  // }: {
  //   is_draft?: boolean;
  //   action?: string;
  // }) => {
  //   console.log("submit$$$$$$$---", formData, is_draft);
  //   let isValid;
  //   if (is_draft) {
  //     isValid = Object.keys(errors).length === 0;
  //   } else {
  //     console.log("VALIDATION",Object.keys(errors).length,errors);
  //     isValid = await validateForm();
  //   }
  //   console.log("isValid&&&&&&&&&&&", isValid, errors);
  //   if (isValid) {
  //     let data = formData;
  //     // data.companyLogo = (formData?.companyLogo as any)?.name || null;
  //     // data.companyLogo = (formData?.companyLogo as any)?.name || null;
  //     //data.companyLogo = formData?.companyLogo?.name;
  //     data.isDraft = action && action === "payment" ? true : is_draft ?? false;
  //     if (!is_draft) {
  //       if (imageFile) {
  //         const url = await handleImageUpload(imageFile);
  //         data.imageUrl = typeof url == "string" ? url : "";
  //       }
  //       if (searchParams && searchParams.id) {
  //         data.jobId = searchParams.id;
  //       }
  //       if(showPayment) {
  //         let res = await onSubmit(data);

  //       console.log("Success", res);
  //       if (res && "status" in res && res.status) {

  //         // router.push("/payment");
  //         // return redirect("/payment");
  //       }
  //         // setShowPayment(false);
  //       }
  //       else{
  //       setShowPayment(true);
  //     }

  //     } else {
  //       if (imageFile) {
  //         const url = await handleImageUpload(imageFile);
  //         data.imageUrl = typeof url == "string" ? url : "";
  //         console.log("Image Upload111", formData);
  //       }
  //       if (searchParams && searchParams.id) {
  //         data.jobId = searchParams.id;
  //       }
  //       // let res = true;
  //       let res = await onSubmit(data);

  //       console.log("Success", res);
  //       if (res && "status" in res && res.status) {
  //         console.log("Success", res);
  //         setModalOpen(true);
  //         setFormData({
  //           companyLogo: null,
  //           employerName: "",
  //           employerWebsite: "",
  //           jobTitle: "",
  //           jobType: "",
  //           solutionArea: "",
  //           jobLocation: "",
  //           workplaceType: "",
  //           salaryMin: "",
  //           salaryMax: "",
  //           experience: "",
  //           deadline: null,
  //           skills: [],
  //           jobDescription: "",
  //           isDraft: false,
  //           imageUrl: "",

  //           jobId: "",
  //         });
  //       } else {
  //         setModalOpen(true);
  //         setModalTitle("Fail!");

  //         setModalText("Something went wrong!");
  //       }
  //     }
  //     console.log("Form submitted successfully1:", data, searchParams);

  //     console.log("Form submitted successfully:", formData);
  //   } else {
  //     console.log("Form has errors:", errors);
  //   }
  // };

  const handleSubmit = ({
    is_draft,
    action,
  }: {
    is_draft?: boolean;
    action?: string;
  }): Promise<void> => {
    setIsSubmitting(true);
    return new Promise((resolve, reject) => {
      console.log("submit$$$$$$$---", formData, is_draft);
      let isValidPromise;

      if (is_draft) {
        isValidPromise = Promise.resolve(Object.keys(errors).length === 0);
      } else {
        console.log("VALIDATION", Object.keys(errors).length, errors);
        isValidPromise = validateForm();
      }

      isValidPromise.then((isValid) => {
        console.log("isValid&&&&&&&&&&&", isValid, errors);
        if (isValid) {
          let data = formData;
          data.isDraft = action === "payment" ? true : is_draft ?? false; //If is_draft is not null or undefined, then data.isDraft is assigned the value of is_draft.
          //Otherwise, it is assigned false.

          let uploadPromise = Promise.resolve();

          if (imageFile) {
            uploadPromise = handleImageUpload(imageFile).then((url) => {
              data.imageUrl = typeof url === "string" ? url : "";
            });
          }

          uploadPromise
            .then(() => {
              if (searchParams?.id) {
                data.jobId = searchParams.id;
              }
              console.log("sasat33", is_draft);

              if (!is_draft) {
                if (showPayment) {
                  console.log("sasat2");
                  return saveJob(data).then((res) => {
                    console.log("Success", res);
                    if (res && "status" in res && res.status) {
                      if (res && "id" in res && res.id) {
                        setJobId(res.id);
                      }
                      resolve();
                    }
                  });
                } else {
                  saveJob(data).then((res) => {
                    console.log("Success", res);
                    if (res && "status" in res && res.status) {
                      if (res && "id" in res && res.id) {
                        setJobId(res.id);
                      }
                    }
                  });
                  console.log("sasat1");
                  setShowPayment(true);
                 
                  setIsSubmitting(false);
                  reject("Failed to submit job.");
                }
              } else {
                return saveJob(data).then((res) => {
                  console.log("Success", res);
                  if (res && "status" in res && res.status) {
                    if (res && "id" in res && res.id) {
                      setJobId(res.id);
                    }
                    setModalOpen(true);
                    setFormData({
                      companyLogo: null,
                      employerName: "",
                      employerWebsite: "",
                      jobTitle: "",
                      jobType: "",
                      solutionArea: "",
                      jobLocation: "",
                      workplaceType: "",
                      salaryMin: "",
                      salaryMax: "",
                      experience: "",
                      deadline: null,
                      skills: [],
                      jobDescription: "",
                      isDraft: false,
                      imageUrl: "",
                      jobId: "",
                    });
                    setPreviewUrl(null);
                    resolve();
                  } else {
                    setModalOpen(true);
                    setModalTitle("Fail!");
                    setModalText("Something went wrong!");
                    reject("Job submission failed.");
                  }
                });
              }
            })
            .then(() => {
              console.log("Form submitted successfully1:", data, searchParams);
              console.log("Form submitted successfully:", formData);
            })
            .catch((error) => {
              console.error("Error during submission:", error);
              setModalOpen(true);
              setModalTitle("Fail!");
              setModalText("Something went wrong!");
              reject(error);
            })
            .finally(() => {
              setIsSubmitting(false);
            });
        } else {
          console.log("Form has errors:", errors);
          setIsSubmitting(false);
          reject("Form validation failed.");
        }
      });
    });
  };

  // const handleDraft = async () => {
  //   console.log("Form 6789saved successfully");
  //   setFormData((prev) => ({ ...prev, ["isDraft"]: true }));
  //   setModalText("Job has been successfully saved as a draft!");
  //   console.log("Form 6789saved successfully", hasAtLeastOneField());
  //   if (hasAtLeastOneField()) {
  //     handleSubmit({ is_draft: true });
  //   } else {
  //     setModalText("Please enter at least one field to save as a draft.");

  //     setWarningModal(true);
  //   }
  // };
  const handleDraft = () => {
    console.log("Form 6789 saved successfully");

    setFormData((prev) => ({ ...prev, isDraft: true }));
    setModalText("Job has been successfully saved as a draft!");

    console.log("Form 6789 saved successfully", hasAtLeastOneField());
    setIsDraftSaving(true);
    if (hasAtLeastOneField()) {
      handleSubmit({ is_draft: true })
        .then(() => {
          console.log("Draft saved successfully.");
        })
        .catch((error) => {
          console.error("Error while saving draft:", error);
        })
        .finally(() => {
          setIsDraftSaving(false);
        });
    } else {
      setModalText("Please enter at least one field to save as a draft.");
      setWarningModal(true);
      setIsDraftSaving(false);
    }
  };

  interface ImagePreviewWrapperProps {
    file: File | string | null;
  }
  const showPaymentpage = () => {
    setShowPayment(false);
  };
  const ImagePreviewWrapper = ({ file }: ImagePreviewWrapperProps) => {
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
      if (!file) {
        setPreview(null);
        return;
      }

      if (file instanceof File) {
        // Handle File object
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        return () => {
          URL.revokeObjectURL(objectUrl);
        };
      } else if (typeof file === "string") {
        // Handle URL string
        setPreview(file);
      }
    }, [file]);

    return preview ? (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "120px",
        }}
      >
        <img
          src={preview}
          alt="Preview"
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            borderRadius: "9.1px",
          }}
        />
      </div>
    ) : null;
  };

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    data?.[0]?.employer_logo || null
  );

  useEffect(() => {
    // Cleanup function for object URLs
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div>
   
    {showPayment ? 
  (
    <div>
      {/* <PaymentForm setShowPayment={setShowPayment} handleSubmit={handleSubmit} /> */}
      <PaymentForm
        setShowPayments={showPaymentpage}
        handleSubmit={handleSubmit}
        payment={true}
        jobId={jobId}
      />
    </div>
  ) : 
  (
    <div>
      {/* <img 
  src="https://ozdzeyzskmvrqxwbkkuq.supabase.co/storage/v1/object/sign/images/uploads/1737098276506-Screenshot%20(8).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJpbWFnZXMvdXBsb2Fkcy8xNzM3MDk4Mjc2NTA2LVNjcmVlbnNob3QgKDgpLnBuZyIsImlhdCI6MTczNzEwMjExOCwiZXhwIjoxNzM3NzA2OTE4fQ.dqHXoiZzJjWaj1DFA_TW2XrN_URmP66X2xl9hJnDUVE&t=2025-01-17T08%3A21%3A59.151Z"
  // https://ozdzeyzskmvrqxwbkkuq.supabase.co/storage/v1/object/public/images/uploads/1737098276506-Screenshot%20(8).png" 
  alt="Employer Logo" 
  style={{ width: "200px", height: "auto", objectFit: "contain" }} 
/> */}
      <Box
        mx="auto"
        p="lg"
        style={{
          maxWidth: "89%",
          // borderRadius: 8,
          backgroundColor: "white",
          // boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        <form>
          <Grid
            gutter={34}
            style={{
              gap: "5%",
              padding: "3px",
            }}
          >
            <Grid.Col span={12}>
              <div
                style={{
                  paddingTop: "23px",
                }}
              >
                {/* <FileInput
                  size="md"
                  label="Company Logo"
                  clearable={false}
                  valueComponent={(props) => (
                    <ImagePreviewWrapper
                      file={props.value instanceof File ? props.value : null}
                    />
                  )}
                  placeholder={
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyItems: "center",
                        flexDirection: "column",
                        paddingTop: "10px",
                      }}
                    >
                      <div>
                        <svg
                          width="25"
                          height="25"
                          viewBox="0 0 15 15"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M7.81825 1.18188C7.64251 1.00615 7.35759 1.00615 7.18185 1.18188L4.18185 4.18188C4.00611 4.35762 4.00611 4.64254 4.18185 4.81828C4.35759 4.99401 4.64251 4.99401 4.81825 4.81828L7.05005 2.58648V9.49996C7.05005 9.74849 7.25152 9.94996 7.50005 9.94996C7.74858 9.94996 7.95005 9.74849 7.95005 9.49996V2.58648L10.1819 4.81828C10.3576 4.99401 10.6425 4.99401 10.8182 4.81828C10.994 4.64254 10.994 4.35762 10.8182 4.18188L7.81825 1.18188ZM2.5 9.99997C2.77614 9.99997 3 10.2238 3 10.5V12C3 12.5538 3.44565 13 3.99635 13H11.0012C11.5529 13 12 12.5528 12 12V10.5C12 10.2238 12.2239 9.99997 12.5 9.99997C12.7761 9.99997 13 10.2238 13 10.5V12C13 13.104 12.1062 14 11.0012 14H3.99635C2.89019 14 2 13.103 2 12V10.5C2 10.2238 2.22386 9.99997 2.5 9.99997Z"
                            fill="currentColor"
                            fillRule="evenodd"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      </div>
                      <div style={{ fontSize: "14px", textAlign: "center" }}>
                        Logo
                      </div>
                    </div>
                  }
                  accept="image/*"
                  styles={{
                    input: {
                      borderRadius: "9.1px",
                      width: "100%",
                      minHeight: "120px",
                      maxWidth: "140px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                    label: {
                      fontSize: "18px",
                      fontWeight: 600,
                      paddingBottom: "10px",
                    },
                  }}
                  value={formData.companyLogo}
                  onChange={(file) => handleInputChange("companyLogo", file)}
                /> */}

                <FileInput
                  size="md"
                  label="Company Logo"
                  clearable={false}
                  valueComponent={() => {
                    const displayUrl = previewUrl || formData.imageUrl;
                    return displayUrl ? (
                      <div
                        style={{
                          width: "100%",
                          height: "120px",
                          pointerEvents: "none",
                          position: "relative",
                        }}
                      >
                        <img
                          src={displayUrl}
                          alt="Preview"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            borderRadius: "9.1px",
                          }}
                        />
                      </div>
                    ) : null;
                  }}
                  accept="image/*"
                  value={formData.imageUrl}
                  onChange={(file) => {
                    if (file) {
                      if (file instanceof File) {
                        const newUrl = URL.createObjectURL(file);
                        setPreviewUrl(newUrl);
                        handleInputChange("imageUrl", file);
                      } else {
                        setPreviewUrl(file);
                        handleInputChange("imageUrl", file);
                      }
                    }
                  }}
                  placeholder={
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyItems: "center",
                        flexDirection: "column",
                        paddingTop: "10px",
                      }}
                    >
                      <svg
                        width="25"
                        height="25"
                        viewBox="0 0 15 15"
                        fill="none"
                      >
                        <path
                          d="M7.81825 1.18188C7.64251 1.00615 7.35759 1.00615 7.18185 1.18188L4.18185 4.18188C4.00611 4.35762 4.00611 4.64254 4.18185 4.81828C4.35759 4.99401 4.64251 4.99401 4.81825 4.81828L7.05005 2.58648V9.49996C7.05005 9.74849 7.25152 9.94996 7.50005 9.94996C7.74858 9.94996 7.95005 9.74849 7.95005 9.49996V2.58648L10.1819 4.81828C10.3576 4.99401 10.6425 4.99401 10.8182 4.81828C10.994 4.64254 10.994 4.35762 10.8182 4.18188L7.81825 1.18188ZM2.5 9.99997C2.77614 9.99997 3 10.2238 3 10.5V12C3 12.5538 3.44565 13 3.99635 13H11.0012C11.5529 13 12 12.5528 12 12V10.5C12 10.2238 12.2239 9.99997 12.5 9.99997Z"
                          fill="currentColor"
                        />
                      </svg>
                      <div style={{ fontSize: "14px", textAlign: "center" }}>
                        Logo
                      </div>
                    </div>
                  }
                  styles={{
                    input: {
                      borderRadius: "9.1px",
                      width: "100%",
                      minHeight: "120px",
                      maxWidth: "140px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                    label: {
                      fontSize: "18px",
                      fontWeight: 600,
                      paddingBottom: "10px",
                    },
                  }}
                />
                {errors.imageUrl ? (
                  <div style={{ color: "red" }}>{errors.imageUrl}</div>
                ) : (
                  <Text size="md" color="gray.6">
                    {acceptedFormats}
                  </Text>
                )}
              </div>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <div>
                <TextInput
                  size="md"
                  required
                  label="Employer Name"
                  placeholder="Name"
                  value={formData.employerName}
                  onChange={(e) =>
                    handleInputChange("employerName", e.target.value)
                  }
                  styles={{
                    ...inputStyles,
                    required: {
                      color: "black", // Change the asterisk color
                    },
                  }}
                />
                {errors.employerName && (
                  <div style={{ color: "red" }}>{errors.employerName}</div>
                )}
              </div>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <div>
                <TextInput
                  size="md"
                  required
                  label="Employer Website"
                  placeholder="Website Link"
                  // withAsterisk
                  value={formData.employerWebsite}
                  onChange={(e) =>
                    handleInputChange("employerWebsite", e.target.value)
                  }
                  styles={{
                    ...inputStyles,
                    required: {
                      color: "black", // Change the asterisk color
                    },
                  }}
                />
                {errors.employerWebsite && (
                  <div style={{ color: "red" }}>{errors.employerWebsite}</div>
                )}
              </div>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <div>
                <TextInput
                  size="md"
                  required
                  label="Job Title"
                  placeholder="Title"
                  // withAsterisk
                  value={formData.jobTitle}
                  onChange={(e) =>
                    handleInputChange("jobTitle", e.target.value)
                  }
                  styles={{
                    ...inputStyles,
                    required: {
                      color: "black", // Change the asterisk color
                    },
                  }}
                />
                {errors.jobTitle && (
                  <div style={{ color: "red" }}>{errors.jobTitle}</div>
                )}
              </div>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <div>
                <Select
                  size="md"
                  required
                  label="Job Type"
                  placeholder="Full Time"
                  data={["Full Time", "Part Time", "Internship", "Freelance"]}
                  // data={["FULLTIME", "CONTRACTOR", "TEMPORARY"]}
                  // withAsterisk
                  value={formData.jobType}
                  onChange={(value) => handleInputChange("jobType", value)}
                  styles={{
                    ...inputStyles,
                    required: {
                      color: "black", // Change the asterisk color
                    },
                  }}
                  clearable
                />
                {errors.jobType && (
                  <div style={{ color: "red" }}>{errors.jobType}</div>
                )}
              </div>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <div>
                <Select
                  size="md"
                  label="Solution Area"
                  placeholder="Technology"
                  required
                  data={[
                    "All",
                    "Business Application",
                    "Data and AI",
                    "Digital and App Innovation",
                    "Modern Workplace and Surface",
                    "Infrastructure",
                    "Security",
                  ]}
                  // withAsterisk
                  value={formData.solutionArea}
                  onChange={(value) => handleInputChange("solutionArea", value)}
                  styles={{
                    ...inputStyles,
                    required: {
                      color: "black", // Change the asterisk color
                    },
                  }}
                  clearable
                />
                {errors.solutionArea && (
                  <div style={{ color: "red" }}>{errors.solutionArea}</div>
                )}
              </div>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <div>
                <TextInput
                  size="md"
                  label="Job Location"
                  placeholder="Location"
                  required
                  // withAsterisk
                  value={formData.jobLocation}
                  onChange={(e) =>
                    handleInputChange("jobLocation", e.target.value)
                  }
                  // className="custom-input"
                  styles={{
                    ...inputStyles,
                    required: {
                      color: "black", // Change the asterisk color
                    },
                  }}
                />
                {errors.jobLocation && (
                  <div style={{ color: "red" }}>{errors.jobLocation}</div>
                )}
              </div>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <div>
                <Select
                  size="md"
                  label="Workplace Type"
                  required
                  placeholder="On Site"
                  data={["On-Site", "Remote"]}
                  value={formData.workplaceType}
                  onChange={(value) =>
                    handleInputChange("workplaceType", value)
                  }
                  styles={{
                    ...inputStyles,
                    required: {
                      color: "black", // Change the asterisk color
                    },
                  }}
                  clearable
                />
                {errors.workplaceType && (
                  <div style={{ color: "red" }}>{errors.workplaceType}</div>
                )}
              </div>
            </Grid.Col>
            {/* <Grid.Col span={{ base: 12, sm: 6 }}>
              <div>
                <TextInput
                  size="md"
                  label="Salary Range"
                  placeholder="$25,000 - $50,000"
                  // withAsterisk
                  value={formData.salaryRange}
                  onChange={(e) =>
                    handleInputChange("salaryRange", e.target.value)
                  }
                  styles={{
                    ...inputStyles,
                  }}
                />
                {errors.salaryRange && (
                  <div style={{ color: "red" }}>{errors.salaryRange}</div>
                )}
              </div>
            </Grid.Col> */}
            {/* <Grid.Col span={{ base: 12, sm: 6 }}>
              <div>
                <label
                  style={{
                    fontWeight: "bold",
                    display: "block",
                    marginBottom: "0.5rem",
                  }}
                >
                  Salary Range (per annum)
                </label>
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: "50%",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <TextInput
                      id="salaryMax"
                      size="md"
                      placeholder="Min"
                      value={formData.salaryMin}
                      onChange={(e) =>
                        handleInputChange("salaryMin", e.target.value)
                      }
                      styles={{
                        ...inputStyles,
                      }}
                    />
                  </div>

                  <div style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
                    -
                  </div>
                  <div
                    style={{
                      display: "flex",
                      width: "50%",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <TextInput
                      id="salaryMin"
                      size="md"
                      type="number"
                      placeholder="Max"
                      value={formData.salaryMax}
                      onChange={(e) =>
                        handleInputChange("salaryMax", e.target.value)
                      }
                      styles={{
                        ...inputStyles,
                      }}
                    />
                  </div>
                </div>
              </div>
            </Grid.Col> */}
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <div>
                <label
                  style={{
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "0.5rem",
                  }}
                >
                  Salary Range (Annual)
                </label>
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px", // Increased from 5px for better spacing
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: "45%", // Increased from 40% for better proportions
                    }}
                  >
                    <TextInput
                      id="salaryMax"
                      size="md"
                      required
                      type="number"
                      placeholder="Min"
                      value={formData.salaryMin}
                      onChange={(e) =>
                        handleInputChange("salaryMin", e.target.value)
                      }
                      rightSection={
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: 600,
                          }}
                        >
                          $
                        </div>
                      }
                      styles={{
                        ...inputStyles,
                        input: {
                          ...inputStyles.input,
                          paddingRight: "60px", // Space for currency selector
                        },
                      }}
                    />
                  </div>

                  <div style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
                    -
                  </div>

                  <div
                    style={{
                      display: "flex",
                      width: "45%", // Increased from 40% for better proportions
                    }}
                  >
                    <TextInput
                      id="salaryMin"
                      size="md"
                      type="number"
                      placeholder="Max"
                      value={formData.salaryMax}
                      onChange={(e) =>
                        handleInputChange("salaryMax", e.target.value)
                      }
                      rightSection={
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: 600,
                          }}
                        >
                          $
                        </div>
                      }
                      styles={{
                        ...inputStyles,
                        input: {
                          ...inputStyles.input,
                          paddingRight: "60px",
                        },
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyItems: "flex-start",
                    alignItems: "center",
                    gap: "12px",
                    width: "100%",
                    marginTop: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: "55%", // Increased from 40% for better proportions
                    }}
                  >
                    {errors.salaryMin && (
                      <div style={{ color: "red" }}>{errors.salaryMin}</div>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      width: "45%",
                      // Increased from 40% for better proportions
                    }}
                  >
                    {errors.salaryMax && (
                      <div style={{ color: "red" }}>{errors.salaryMax}</div>
                    )}
                  </div>
                </div>
              </div>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <div>
                <NumberInput
                  size="md"
                  label="Preferred Years Of Experience"
                  placeholder="Experience"
                  required
                  // withAsterisk
                  min={0}
                  value={formData.experience}
                  onChange={(value) => handleInputChange("experience", value)}
                  styles={{
                    ...inputStyles,
                    required: {
                      color: "black",
                    },
                  }}
                />
                {errors.experience && (
                  <div style={{ color: "red" }}>{errors.experience}</div>
                )}
              </div>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <div>
                <DateInput
                  size="md"
                  label="Select Application Deadline"
                  required
                  minDate={new Date()}
                  value={formData.deadline}
                  placeholder="Job Application Deadline"
                  className="custom-input"
                  styles={{
                    ...inputStyles,
                    required: {
                      color: "black", // Change the asterisk color
                    },
                  }}
                  onChange={(value) => handleInputChange("deadline", value)}
                  clearable
                />
                {errors.deadline && (
                  <div style={{ color: "red" }}>{errors.deadline}</div>
                )}
              </div>
            </Grid.Col>

            {/* <Grid.Col span={{ base: 12, sm: 6 }}>
              <div>
                <Textarea
                  label="Skills Required"
                  placeholder="Add Skills"
                  minRows={4}
                  // withAsterisk
                  required
                  value={formData.skills}
                  onChange={(e) => handleInputChange("skills", e.target.value)}
                  styles={{
                    ...textStyles,
                  }}
                />
                {errors.skills && (
                  <div style={{ color: "red" }}>{errors.skills}</div>
                )}
              </div>
            </Grid.Col> */}

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <div>
                <TagsInput
                  size="md"
                  label="Skills Required"
                  placeholder="Press Enter to submit a skill"
                  required
                  value={formData.skills}
                  onChange={(skills) => handleInputChange("skills", skills)}
                  onRemove={(removedSkill) =>
                    handleInputChange(
                      "skills",
                      formData.skills.filter(
                        (skill: string) => skill !== removedSkill
                      )
                    )
                  }
                  styles={{
                    ...textStyles,
                    ...tagStyles,
                    required: {
                      color: "black", // Change the asterisk color
                    },
                  }}
                />

                {errors.skills && (
                  <div style={{ color: "red" }}>{errors.skills}</div>
                )}
              </div>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <div>
                <Textarea
                  size="md"
                  required
                  label="Job Description"
                  placeholder="Enter The Job Description"
                  minRows={4}
                  // withAsterisk
                  value={formData.jobDescription}
                  onChange={(e) =>
                    handleInputChange("jobDescription", e.target.value)
                  }
                  styles={{
                    ...textStyles,
                    required: {
                      color: "black", // Change the asterisk color
                    },
                  }}
                />
                {errors.jobDescription && (
                  <div style={{ color: "red" }}>{errors.jobDescription}</div>
                )}
              </div>
            </Grid.Col>
          </Grid>
        </form>
      </Box>
      <Group
        mt="lg"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "16px", // Space between buttons
        }}
      >
        <Button
          type="submit"
          size="md"
          disabled={isDraftSaving}
          style={{
            border: "2px solid #004A93",
            backgroundColor: "#F7FAFC",
            color: "#004A93",
          }}
          onClick={handleDraft}
        >
          {isDraftSaving ? "Saving..." : "Save as Draft"}
        </Button>
        <Button
          type="submit"
          size="md"
          style={{
            backgroundColor: "#004A93",
            color: "white",
            minWidth: "140px",
            transition: "all 0.3s ease",
          }}
          onClick={() => handleSubmit({})}
        >
          Make Payment
        </Button>

        <Modal
          opened={isModalOpen}
          onClose={() => setModalOpen(false)}
          centered
          size="lg"
        >
          <Box ml={40} mr={40} mb={40}>
            <Title
              ta="left"
              order={1}
              className={SFProRounded.className}
              c="blue"
              mb={10}
            >
              {ModalTitle ? ModalTitle : "Success!"}
              {/* {searchParams?.message && searchParams.message == "Success" ? "Success!" : "Fail!"} */}
            </Title>
            <Text className={SFProRounded.className} c="dark" size="md">
              {/* {searchParams?.message && searchParams.message == "Fail"?"Somthing went wrong Please try again!": ModalText?.length?ModalText:"The form has been submitted successfully!"} */}
              {ModalText?.length
                ? ModalText
                : "Your job listing request has been submitted and is pending approval. You will be notified via email when the job goes live."}
            </Text>
            <Button
              style={buttonStyle}
              onClick={() => {
                setModalOpen(false);
                setModalClose(true);
              }}
              mt="md"
            >
              OK
            </Button>
          </Box>
        </Modal>

        <Modal
          opened={warningModal}
          onClose={() => setWarningModal(false)}
          centered
          size="lg"
        >
          <Box ml={40} mr={40} mb={40}>
            <Title
              ta="left"
              order={1}
              className={SFProRounded.className}
              c="blue"
              mb={10}
            >
              Warning!
              {/* {searchParams?.message && searchParams.message == "Success" ? "Success!" : "Fail!"} */}
            </Title>
            <Text className={SFProRounded.className} c="dark" size="md">
              {/* {searchParams?.message && searchParams.message == "Fail"?"Somthing went wrong Please try again!": ModalText?.length?ModalText:"The form has been submitted successfully!"} */}
              {ModalText}
            </Text>
            <Button
              style={buttonStyle}
              onClick={() => {
                setWarningModal(false);
              }}
              mt="md"
            >
              OK
            </Button>
          </Box>
        </Modal>
      </Group>
    </div>
  )
  }
  </div>
)
};

export default EmpJobForm;

const inputStyles = {
  input: {
    border: "0.91px solid #D6D6D6",
    minHeight: "48px",
    borderRadius: "9.1px",
  },
  label: {
    fontSize: "16px",
    fontWeight: 600,
    paddingBottom: "11px",
  },
  placeholder: {
    fontSize: "20px",
    fontWeight: 400,
    color: "#AEB0B4",
  },
};
const textStyles = {
  input: {
    borderRadius: "9.1px",
    border: "0.91px solid #D6D6D6",
    minHeight: "180px",
  },
  label: {
    fontSize: "16px",
    fontWeight: 600,
    paddingBottom: "11px",
  },
  placeholder: {
    fontSize: "20px",
    fontWeight: 400,
    color: "#AEB0B4",
  },
};
const tagStyles = {
  pill: {
    backgroundColor: "white",
    color: "#004A93",
    margin: "2px",
    borderRadius: "10px",
    border: "1px solid #004A93",
  },
};

const buttonStyle = {
  backgroundColor: "#004a93",
  color: "white",
  // padding: "10px",
  borderRadius: "20px",
  height: "40px",
  fontSize: "16px",
  fontWeight: 500,
  border: "none",
  cursor: "pointer",
  transition: "background-color 0.3s",
};
