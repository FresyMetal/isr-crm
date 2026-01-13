ALTER TABLE `clientes` ADD `codigo` varchar(50);--> statement-breakpoint
ALTER TABLE `clientes` ADD `tipo_cliente` varchar(50);--> statement-breakpoint
ALTER TABLE `clientes` ADD `tipo_id` varchar(20);--> statement-breakpoint
ALTER TABLE `clientes` ADD `numero` varchar(20);--> statement-breakpoint
ALTER TABLE `clientes` ADD `contacto` varchar(255);--> statement-breakpoint
ALTER TABLE `clientes` ADD `calle1` varchar(255);--> statement-breakpoint
ALTER TABLE `clientes` ADD `calle2` varchar(255);--> statement-breakpoint
ALTER TABLE `clientes` ADD `domicilio` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `latitud` varchar(50);--> statement-breakpoint
ALTER TABLE `clientes` ADD `longitud` varchar(50);--> statement-breakpoint
ALTER TABLE `clientes` ADD `extra1` varchar(255);--> statement-breakpoint
ALTER TABLE `clientes` ADD `extra2` varchar(255);--> statement-breakpoint
ALTER TABLE `clientes` ADD `domicilio_fiscal` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `medio_pago` varchar(50);--> statement-breakpoint
ALTER TABLE `clientes` ADD `cobrador` varchar(255);--> statement-breakpoint
ALTER TABLE `clientes` ADD `vendedor` varchar(255);--> statement-breakpoint
ALTER TABLE `clientes` ADD `contrato` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `clientes` ADD `tipo_contrato` varchar(100);--> statement-breakpoint
ALTER TABLE `clientes` ADD `fecha_vencimiento` timestamp;--> statement-breakpoint
ALTER TABLE `clientes` ADD `gratis` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `clientes` ADD `recuperacion` varchar(255);--> statement-breakpoint
ALTER TABLE `clientes` ADD `cbu` varchar(50);--> statement-breakpoint
ALTER TABLE `clientes` ADD `tarjeta_credito` varchar(100);--> statement-breakpoint
ALTER TABLE `clientes` ADD `pago_automatico` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `clientes` ADD `envio_factura_auto` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `clientes` ADD `envio_recibo_pago_auto` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `clientes` ADD `bloquear` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `clientes` ADD `pre_aviso` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `clientes` ADD `ter_venc` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `clientes` ADD `prox_mes` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `clientes` ADD `actividad_comercial` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD CONSTRAINT `clientes_codigo_unique` UNIQUE(`codigo`);