import AWSConfigLoaderInternal from './Providers/AWS/ConfigLoader';
import AWSInternal from './Providers/AWS';
import GoogleInternal from './Providers/Google';
import ServiceResponseInternal from './Utils/ServiceResponse';
import {DEP_NAMES as DEP_NAMES_INTERNAL} from './Providers/Constants';

export const DEP_NAMES = DEP_NAMES_INTERNAL;

export const ServiceResponse = ServiceResponseInternal;

export const AWSConfigLoader = AWSConfigLoaderInternal;
export const AWS = AWSInternal;
export const Google = GoogleInternal;
