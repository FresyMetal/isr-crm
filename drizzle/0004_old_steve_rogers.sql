CREATE TABLE `historial_cambios_plan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cliente_id` int NOT NULL,
	`plan_anterior_id` int,
	`plan_anterior_nombre` varchar(255),
	`precio_anterior` decimal(10,2),
	`plan_nuevo_id` int NOT NULL,
	`plan_nuevo_nombre` varchar(255) NOT NULL,
	`precio_nuevo` decimal(10,2) NOT NULL,
	`dias_restantes` int,
	`ajuste_prorrateo` decimal(10,2) DEFAULT '0.00',
	`fecha_cambio` timestamp NOT NULL DEFAULT (now()),
	`fecha_aplicacion` timestamp NOT NULL,
	`motivo` text,
	`observaciones` text,
	`realizado_por` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `historial_cambios_plan_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `cliente_idx` ON `historial_cambios_plan` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `fecha_cambio_idx` ON `historial_cambios_plan` (`fecha_cambio`);