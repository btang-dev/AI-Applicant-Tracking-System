import type { ComponentPropsWithoutRef } from "react";
import { cn } from "~/lib/utils";

export const Accordion = ({
    className,
    ...props
}: ComponentPropsWithoutRef<"div">) => (
    <div
        className={cn(
            "w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm",
            className,
        )}
        {...props}
    />
);

export const AccordionItem = ({
    className,
    ...props
}: ComponentPropsWithoutRef<"details">) => (
    <details
        className={cn(
            "group border-b border-gray-200 last:border-b-0",
            className,
        )}
        {...props}
    />
);

export const AccordianHeader = ({
    className,
    children,
    ...props
}: ComponentPropsWithoutRef<"summary">) => (
    <summary
        className={cn(
            "flex cursor-pointer list-none items-center gap-4 p-5 marker:content-none [&::-webkit-details-marker]:hidden",
            className,
        )}
        {...props}
    >
        {children}
        <svg
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            className="size-5 shrink-0 text-gray-500 transition-transform duration-200 group-open:rotate-180"
        >
            <path
                d="m5 7.5 5 5 5-5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    </summary>
);

export const AccordionContent = ({
    className,
    ...props
}: ComponentPropsWithoutRef<"div">) => (
    <div
        className={cn("border-t border-gray-100 px-5 py-5", className)}
        {...props}
    />
);
