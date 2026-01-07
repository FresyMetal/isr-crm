CREATE TABLE `actividad_cliente` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cliente_id` int NOT NULL,
	`usuario_id` int,
	`tipo` varchar(100) NOT NULL,
	`descripcion` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `actividad_cliente_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campanas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`descripcion` text,
	`tipo` varchar(100),
	`fecha_inicio` timestamp NOT NULL,
	`fecha_fin` timestamp,
	`presupuesto` decimal(10,2),
	`leads_generados` int DEFAULT 0,
	`clientes_convertidos` int DEFAULT 0,
	`activa` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campanas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clientes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`apellidos` varchar(255),
	`dni` varchar(20),
	`email` varchar(320),
	`telefono` varchar(20),
	`telefono_alternativo` varchar(20),
	`direccion` text NOT NULL,
	`codigo_postal` varchar(10),
	`localidad` varchar(255) NOT NULL,
	`provincia` varchar(255),
	`direccion_facturacion` text,
	`numero_serie_ont` varchar(50),
	`mac_ont` varchar(20),
	`modelo_ont` varchar(100),
	`perfil_velocidad` varchar(100),
	`perfil_usuario` varchar(100),
	`olt` varchar(100),
	`pon` varchar(50),
	`vlan` varchar(20),
	`ip_fija` varchar(45),
	`estado` enum('activo','suspendido','baja','pendiente_instalacion') NOT NULL DEFAULT 'pendiente_instalacion',
	`motivo_suspension` text,
	`fecha_alta` timestamp NOT NULL DEFAULT (now()),
	`fecha_baja` timestamp,
	`motivo_baja` text,
	`plan_id` int,
	`fecha_instalacion` timestamp,
	`observaciones` text,
	`creado_por` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clientes_id` PRIMARY KEY(`id`),
	CONSTRAINT `clientes_numero_serie_ont_unique` UNIQUE(`numero_serie_ont`)
);
--> statement-breakpoint
CREATE TABLE `comentarios_ticket` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticket_id` int NOT NULL,
	`usuario_id` int NOT NULL,
	`comentario` text NOT NULL,
	`interno` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comentarios_ticket_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conceptos_factura` (
	`id` int AUTO_INCREMENT NOT NULL,
	`factura_id` int NOT NULL,
	`descripcion` varchar(255) NOT NULL,
	`cantidad` int NOT NULL DEFAULT 1,
	`precio_unitario` decimal(10,2) NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conceptos_factura_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `facturas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cliente_id` int NOT NULL,
	`numero_factura` varchar(50) NOT NULL,
	`fecha_emision` timestamp NOT NULL DEFAULT (now()),
	`fecha_vencimiento` timestamp NOT NULL,
	`periodo_desde` timestamp NOT NULL,
	`periodo_hasta` timestamp NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	`iva` decimal(10,2) NOT NULL,
	`total` decimal(10,2) NOT NULL,
	`estado` enum('pendiente','pagada','vencida','anulada') NOT NULL DEFAULT 'pendiente',
	`fecha_pago` timestamp,
	`metodo_pago` varchar(50),
	`observaciones` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `facturas_id` PRIMARY KEY(`id`),
	CONSTRAINT `facturas_numero_factura_unique` UNIQUE(`numero_factura`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`apellidos` varchar(255),
	`email` varchar(320),
	`telefono` varchar(20),
	`direccion` text,
	`localidad` varchar(255),
	`fuente` varchar(100),
	`estado` enum('nuevo','contactado','calificado','propuesta','ganado','perdido') NOT NULL DEFAULT 'nuevo',
	`interes` enum('bajo','medio','alto') DEFAULT 'medio',
	`asignado_a` int,
	`plan_interes` int,
	`observaciones` text,
	`convertido_cliente_id` int,
	`fecha_conversion` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `logs_pso` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cliente_id` int,
	`operacion` varchar(100) NOT NULL,
	`request_payload` text,
	`codigo_respuesta` int,
	`respuesta` text,
	`exitoso` boolean NOT NULL,
	`mensaje_error` text,
	`intentos` int DEFAULT 1,
	`usuario_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `logs_pso_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pagos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`factura_id` int NOT NULL,
	`cliente_id` int NOT NULL,
	`importe` decimal(10,2) NOT NULL,
	`fecha_pago` timestamp NOT NULL DEFAULT (now()),
	`metodo_pago` varchar(50) NOT NULL,
	`referencia` varchar(100),
	`observaciones` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pagos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `planes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`descripcion` text,
	`tipo` enum('fibra','movil','tv','telefonia_fija','combo') NOT NULL,
	`velocidad_bajada` int,
	`velocidad_subida` int,
	`datos_moviles` int,
	`minutos_llamadas` int,
	`canales_tv` int,
	`perfil_velocidad_pso` varchar(100),
	`perfil_usuario_pso` varchar(100),
	`precio_mensual` decimal(10,2) NOT NULL,
	`precio_instalacion` decimal(10,2) DEFAULT '0.00',
	`precio_promocion` decimal(10,2),
	`meses_promocion` int,
	`activo` boolean NOT NULL DEFAULT true,
	`destacado` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `planes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `servicios_cliente` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cliente_id` int NOT NULL,
	`plan_id` int NOT NULL,
	`fecha_inicio` timestamp NOT NULL DEFAULT (now()),
	`fecha_fin` timestamp,
	`precio_mensual` decimal(10,2) NOT NULL,
	`activo` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `servicios_cliente_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cliente_id` int NOT NULL,
	`numero_ticket` varchar(50) NOT NULL,
	`asunto` varchar(255) NOT NULL,
	`descripcion` text NOT NULL,
	`tipo` enum('averia','consulta','instalacion','cambio_servicio','baja','otro') NOT NULL,
	`prioridad` enum('baja','media','alta','urgente') NOT NULL DEFAULT 'media',
	`estado` enum('abierto','en_proceso','pendiente_cliente','resuelto','cerrado') NOT NULL DEFAULT 'abierto',
	`asignado_a` int,
	`fecha_apertura` timestamp NOT NULL DEFAULT (now()),
	`fecha_cierre` timestamp,
	`solucion` text,
	`tiempo_resolucion` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `tickets_numero_ticket_unique` UNIQUE(`numero_ticket`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','tecnico','comercial') NOT NULL DEFAULT 'user';--> statement-breakpoint
CREATE INDEX `cliente_idx` ON `actividad_cliente` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `fecha_idx` ON `actividad_cliente` (`created_at`);--> statement-breakpoint
CREATE INDEX `estado_idx` ON `clientes` (`estado`);--> statement-breakpoint
CREATE INDEX `localidad_idx` ON `clientes` (`localidad`);--> statement-breakpoint
CREATE INDEX `dni_idx` ON `clientes` (`dni`);--> statement-breakpoint
CREATE INDEX `ticket_idx` ON `comentarios_ticket` (`ticket_id`);--> statement-breakpoint
CREATE INDEX `factura_idx` ON `conceptos_factura` (`factura_id`);--> statement-breakpoint
CREATE INDEX `cliente_idx` ON `facturas` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `estado_idx` ON `facturas` (`estado`);--> statement-breakpoint
CREATE INDEX `fecha_emision_idx` ON `facturas` (`fecha_emision`);--> statement-breakpoint
CREATE INDEX `estado_idx` ON `leads` (`estado`);--> statement-breakpoint
CREATE INDEX `asignado_idx` ON `leads` (`asignado_a`);--> statement-breakpoint
CREATE INDEX `cliente_idx` ON `logs_pso` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `operacion_idx` ON `logs_pso` (`operacion`);--> statement-breakpoint
CREATE INDEX `fecha_idx` ON `logs_pso` (`created_at`);--> statement-breakpoint
CREATE INDEX `factura_idx` ON `pagos` (`factura_id`);--> statement-breakpoint
CREATE INDEX `cliente_idx` ON `pagos` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `cliente_idx` ON `servicios_cliente` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `plan_idx` ON `servicios_cliente` (`plan_id`);--> statement-breakpoint
CREATE INDEX `cliente_idx` ON `tickets` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `estado_idx` ON `tickets` (`estado`);--> statement-breakpoint
CREATE INDEX `asignado_idx` ON `tickets` (`asignado_a`);