import { createFileRoute } from "@tanstack/react-router";
import { AdapterApp } from "@/components/adapter/adapter-app";

export const Route = createFileRoute("/adapter")({ component: AdapterApp });
