import { pickerrError } from '../util/assert';

export class ConfigFileNotFoundError extends pickerrError {}
export class InvalidConfigurationError extends pickerrError {}
export class ConfigReloadError extends pickerrError {}

export class ConfigMustBeRecord extends pickerrError {}
export class HostNameMustBeString extends pickerrError {}
export class PortMustBeNumber extends pickerrError {}
export class LogLevelInvalid extends pickerrError {}
export class ServersMustBeArray extends pickerrError {}
export class ServersMustNotBeEmpty extends pickerrError {}
export class ServerMustBeRecord extends pickerrError {}
export class ServerTypeInvalid extends pickerrError {}
export class ServerUrlMustBeString extends pickerrError {}
export class ServerUrlInvalid extends pickerrError {}
export class ServerTokenMustBeString extends pickerrError {}
export class ServerLibraryTitleFilterInvalid extends pickerrError {}
export class ServerLibraryTypeFilterInvalid extends pickerrError {}
export class ServerBasePathInvalid extends pickerrError {}
export class ServerLinkTypeInvalid extends pickerrError {}
export class BasicAuthInvalid extends pickerrError {}
export class BasicAuthUserNameInvalid extends pickerrError {}
export class BasicAuthPasswordInvalid extends pickerrError {}
export class RequirePlexTvLoginInvalid extends pickerrError {}
export class TlsConfigInvalid extends pickerrError {}
export class TlsConfigCertFileInvalid extends pickerrError {}
export class TlsConfigKeyFileInvalid extends pickerrError {}
